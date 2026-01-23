import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pathToKernScores = [
    `${__dirname}/../schubert-dances/kern/`,
    `${__dirname}/../gonzaga-dances/kern/`,
];
const piecesYamlPath = `${__dirname}/../content/pieces/`;

function getIdFromFilename(path) {
    return path.split(/[\\\/]/).pop().replace(/\..+$/, '');
}

function parseHumdrumReferenceRecords(humdrum) {
    let lines = humdrum.split(/\r?\n/);
    let output = {};
    for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(/^!!!\s*([^:]+)\s*:\s*(.*)\s*$/);
        if (matches) {
            const existingValue = output[matches[1]];
            if (Array.isArray(existingValue)) {
                output[matches[1]].push(matches[2])
            } else if (!Array.isArray(existingValue) && typeof existingValue !== 'undefined') {
                output[matches[1]] = [existingValue, matches[2]]
            } else {
                output[matches[1]] = matches[2];
            }
        }
    }
    return output;
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

execSync(`rm -rf ${piecesYamlPath}`);
execSync(`mkdir -p ${piecesYamlPath}`);

pathToKernScores.forEach(repo => {
    console.log(repo)
    const pathDirs = repo.split('/');
    const prefix = pathDirs[pathDirs.length - 3].split('-')[0]; 
    const composer = prefix === 'schubert' ? 'Franz Schubert' : 'Francisca Gonzaga';

    getFiles(repo).forEach(file => {
        const id = getIdFromFilename(file);
        console.log(id);

        const kern = fs.readFileSync(file, 'utf8');
        const referenceRecords = parseHumdrumReferenceRecords(kern);

        const key = kern.match(/\*([a-hA-H][\#\-]*):/)?.[1] ?? null;
        const meter = kern.match(/\*M(\d+\/\d+)/)?.[1] ?? null;
        const config = Object.assign({
            slug: `${prefix}-${id}`,
            filename: id,
            title: referenceRecords.OTL,
            urlScan: referenceRecords['URL-scan'],
            op: parseInt(referenceRecords.OPS?.replaceAll(/\D/g, '')) || null,
            nr: parseInt(referenceRecords.ONM?.replaceAll(/\D/g, '')) || null,
            largerWorkTitle: referenceRecords.OPR,
            localRawFile: `/kern/${prefix}-dances/${id}.krn`,
            composer,
            key,
            meter,
            majorMinor: key === key.toLowerCase() ? 'minor' : 'major',
            genre: referenceRecords.AGN,
        });

        const configFilename = `${prefix}-${id}.yaml`;
        fs.writeFileSync(`${piecesYamlPath}${configFilename}`, yaml.dump(config, {
            indent: 4,
            lineWidth: -1,
            sortKeys: true,
        }));
    
    });
});
