import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { romanize } from '../app/utils/romanize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pathToKernScores = `${__dirname}/../schubert-dances/kern/`;
const formYamlPath = `${__dirname}/../content/raw-data/form.yaml`;
const formContentYamlPath = `${__dirname}/../content/data/form.yaml`;

function getIdFromFilename(path) {
    return path.split(/[\\\/]/).pop().replace(/\..+$/, '');
}

function getFiles(directory, fileList) {
    fileList = fileList || [];
    let files = fs.readdirSync(directory);
    files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
    for (let i in files) {
        const name = `${directory}/${files[i]}`;
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, fileList);
        } else {
            fileList.push(name);
        }
    }
    return fileList;
}

const formYaml = yaml.load(fs.readFileSync(formYamlPath, 'utf8'));

const formData = {};

function parseTimepoint(tp) {
    if (!tp) {
        return {
            measure: null,
            beat: null,
        };
    }
    const [measureStr, beatStr] = tp.split(/\/(.+)/).filter(Boolean);
    return {
        measure: parseInt(measureStr, 10),
        beat: convertFloatToTwoPart(beatStr),
    };
}

// Convert 3.75 to 3+3/4
function convertFloatToTwoPart(value, spacer = '+') {
    if (!isFinite(value)) return String(value);

    let sign = 1;
    if (value < 0) {
        sign = -1;
        value = -value;
    }

    const integ = Math.floor(value);
    const frac = value - integ;

    if (frac < 1e-10) {
        return (sign < 0 ? '-' : '') + integ.toString();
    }

    // Approximate the fractional part as a simple fraction
    let bestNum = 1, bestDen = 1, bestError = Math.abs(frac - bestNum / bestDen);
    for (let den = 1; den <= 1000; den++) {
        const num = Math.round(frac * den);
        const err = Math.abs(frac - num / den);
        if (err < bestError) {
            bestError = err;
            bestNum = num;
            bestDen = den;
            if (bestError < 1e-8) break;
        }
    }

    // Reduce fraction to lowest terms using greatest common divisor
    let a = bestNum, b = bestDen;
    while (b) [a, b] = [b, a % b];
    const gcd = a;
    bestNum /= gcd;
    bestDen /= gcd;

    let result = '';
    if (sign < 0) result += '-';
    if (integ > 0) {
        result += integ + spacer + `${bestNum}/${bestDen}`;
    } else {
        result += `${bestNum}/${bestDen}`;
    }
    return result;
}

function getParsedFormPart(formPart, kernLines, data) {
    const newProperties = {
        startLine: null,
        endLine: null,
        startKey: null,
        endKey: null,
    };

    const startPoint = formPart.start;
    const endPoint = formPart.end;
    const start = parseTimepoint(startPoint);
    const end = parseTimepoint(endPoint);

    const current = {
        measure: 0,
        key: null,
        meter: null,
        lineNumber: null,
        absb: null,
    }

    for (let i = 0; i < kernLines.length; i++) {
        const line = kernLines[i];
        current.lineNumber = i + 1;

        const lineData = data[`${current.lineNumber}`];

        // Detect current measure number (=N)
        if (line.startsWith('=')) {
            const measureMatch = line.match(/^=(\d+)/);
            if (measureMatch) {
                current.measure = parseInt(measureMatch[1], 10);
            }
        }

        // Detect current changes (e.g. *E-:)
        const keyMatch = line.match(/\*([A-Ha-h\#\-]+):/);
        if (keyMatch) {
            current.key = keyMatch[1];
        }

        // Detect current beat (meter -f)
        current.meter = lineData?.leftHandMeter !== "." ? lineData?.leftHandMeter : lineData?.rightHandMeter;

        // Detect toatal beat count from beginning of piece (beat -c)
        current.absb = lineData?.continuousBeat;

        // check if start of form matches current line
        if (current.measure === start.measure && current.meter === start.beat) {
            newProperties.startLine = current.lineNumber;
            newProperties.startBeat = current.absb;
            newProperties.startKey = current.key;
        }
        
        // check if end of form matches current line
        if (current.measure === end.measure && current.meter === end.beat) {
            newProperties.endLine = current.lineNumber;
            newProperties.endBeat = current.absb;
            newProperties.endKey = current.key;
        }
    }

    const parsedChildren = [];

    if (Array.isArray(formPart.children)) {
        formPart.children.forEach(child => {
            const parsed = getParsedFormPart(child, kernLines, data);
            parsedChildren.push(parsed);
        });
    }

    return Object.assign({}, formPart, newProperties, {
        children: parsedChildren.length ? parsedChildren : undefined,
    });
}

function addLineNumbersAsSpine(kern) {
    const lines = kern.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('**')) {
            line += '\t**lnnr';
        } else if (line.startsWith('*-')) {
            line += '\t*-';
        } else if (line.startsWith('*')) {
            line += '\t*';
        } else if (line.startsWith('!!!')) {
            // do nothing
        } else if (line.startsWith('!')) {
            line += '\t!';
        } else if (line.startsWith('=')) {
            line += '\t=';
        } else {
            line += `\t${i + 1}`;
        }
        lines[i] = line;
    }
    
    return lines.join('\n');
}

getFiles(pathToKernScores).forEach(file => {
    const id = `schubert-${getIdFromFilename(file)}`;
    const pieceForm = formYaml[id];

    if (!pieceForm || pieceForm.length === 0) {
        console.warn(`❌ No form found for ${id}`);
        return;
    }
    
    console.log(`✅ Form found for ${id}`);

    const kernScore = fs.readFileSync(file, 'utf8');
    
    const lnnrKernScore = addLineNumbersAsSpine(kernScore);
    
    const dataAsString = execSync(`beat -cp | beat -dp | beat -da --attacks 0 | meter -r | extractxx -I '**text' | extractxx -I '**dynam' | extractxx -I '**kern' | ridxx -LGTMId`, {
        input: lnnrKernScore,
    }).toString().trim();

/* exmaple output

**dur	**absb	**cdata-beat	**cdata-beat	**lnnr	**dur

spine 1 = slice (line) duration but . when no attack => beat -dp
spine 2 = continuous beat                            => beat -cp
spine 3 = left hand meter                            => meter
spine 4 = right hand meter                           => meter
spine 5 = line number                                => addLineNumbersAsSpine function
spine 6 = slice (line) duration                      => beat -da --attacks 0

1	0	1	1	18	1
1	1	2	2	19	1
1	2	3	3	20	1
1.5	3	1	1	22	1.5
0.5	4.5	2+1/2	2+1/2	23	0.5
1	5	3	3	24	1
1	6	1	1	26	1
1	7	2	2	27	1
1	8	3	3	28	1
3	9	1	1	30	3
1	12	1	1	33	1
1	13	2	2	34	1
1	14	3	3	35	1
1.5	15	1	1	37	1.5
0.5	16.5	2+1/2	2+1/2	38	0.5
...

*/

    const data = Object.fromEntries(dataAsString.split('\n').map(line => line.split('\t')).map((row) => {
        const key = row[4]; // line number

            const obj = {
                sliceDuration: parseFloat(row[0]),
                continuousBeat: parseFloat(row[1]),
                leftHandMeter: row[2].replace('r', ''),
                rightHandMeter: row[3].replace('r', ''),
                sliceDurationAttacks0: parseFloat(row[5]),
            };

            return [key, obj];
    }));

/* example output

{
  '18': {
    sliceDurationStart: '1',
    continuousBeat: '0',
    leftHandMeter: '1',
    rightHandMeter: '1',
    sliceDurationEnd: '1'
  },
  '19': {
    sliceDurationStart: '1',
    continuousBeat: '1',
    leftHandMeter: '2',
    rightHandMeter: '2',
    sliceDurationEnd: '1'
  },
  '20': {
    sliceDurationStart: '1',
    continuousBeat: '2',
    leftHandMeter: '3',
    rightHandMeter: '3',
    sliceDurationEnd: '1'
  },
  '22': {
    sliceDurationStart: '1.5',
    continuousBeat: '3',
    leftHandMeter: '1',
    rightHandMeter: '1',
    sliceDurationEnd: '1.5'
  },
  // ...
}

*/

    const kernLines = kernScore.split('\n');

    formData[id] = [];

    pieceForm.forEach((formPart) => {
        const parsedFormPart = getParsedFormPart(formPart, kernLines, data);
        formData[id].push(parsedFormPart)
    });
});



fs.writeFileSync(formContentYamlPath, yaml.dump(formData, {
    indent: 4,
    lineWidth: -1,
    // sortKeys: true,
}));
