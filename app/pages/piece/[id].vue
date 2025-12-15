<script setup>
const localePath = useLocalePath();
const { params: { id } } = useRoute();
const { data: piece } = await useAsyncData(`pieces/${id}`, () => queryCollection('pieces').where('stem', '=', `pieces/${id}`).first());
const { data: modulationsData } = await useAsyncData(`modulations`, () => queryCollection('data').path('/data/modulations').first(), {deep: false });
const { data: formData } = await useAsyncData(`form`, () => queryCollection('data').path('/data/form').first(), {deep: false });

const modulations = modulationsData.value.body[id] ?? [];
const form = formData.value.body[id] ?? [];

if (!piece.value) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Page Not Found',
    });
}

const { data: surroundData } = await useAsyncData(`pieces/${piece.value.path}/surroundings`, () => queryCollectionItemSurroundings('pieces', piece.value.path, {
    fields: ['slug'],
}));
const [prevPiece, nextPiece] = surroundData.value;

const { localScoreUrlGenerator, githubScoreUrlGenerator, vhvScoreUrlGenerator } = useScoreUrlGenerator();

const scoreOptions = useScoreOptions();

useScoreKeyboardShortcuts({
    prevPiece,
    nextPiece,
});

const options = reactive({
    showKeys: false,
});

const ebene2 = [];

form.forEach(formPart => {
    if (formPart.children && formPart.children.length) {
        formPart.children.forEach(childPart => {
            ebene2.push(childPart);
        });
    }
});
</script>

<template>
    <UContainer>
        <div class="flex flex-col gap-8">
            <div>
                <Heading>
                    {{ `${piece.largerWorkTitle} №${piece.nr}` }}
                    <div class="text-base font-normal">
                        {{ piece.composer }}, Op. {{ piece.op }}
                    </div>
                </Heading>
                <div class="flex gap-2 items-center">
                    <div v-if="prevPiece">
                        <UButton :to="localePath({ name: 'piece-id', params: { id: prevPiece.slug }, hash: $route.hash })">
                            <Icon name="heroicons:arrow-left-circle" class="text-xl" />
                            {{ $t('previous') }}
                        </UButton>
                    </div>
                    <div v-if="nextPiece">
                        <UButton :to="localePath({ name: 'piece-id', params: { id: nextPiece.slug }, hash: $route.hash })">
                            {{ $t('next') }}
                            <Icon name="heroicons:arrow-right-circle" class="text-xl" />
                        </UButton>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-4">
                <div>
                    <ScoreOptionsPalette />
                </div>
                <div class="shrink-0 flex gap-2 ml-auto md:order-2">
                    <MidiPlayer :url="localScoreUrlGenerator(piece.slug)" class="text-2xl"/>
                    <UButton :to="githubScoreUrlGenerator(piece.slug)" target="_blank">
                        {{ $t('github') }}
                    </UButton>
                    <UButton :to="vhvScoreUrlGenerator(piece.slug)" target="_blank">
                        {{ $t('vhv') }}
                    </UButton>
                </div>
            </div>

            <HighlightedScore
                :piece-id="piece.slug"
                :verovio-options="{
                    ...scoreOptions.verovioOptions,
                    header: true,
                    spacingSystem: 15,
                    pageMarginLeft: 50,
                    pageMarginRight: 0,
                    pageMarginTop: 10,
                    pageMarginBottom: 10,
                }"
                :sections="[
                    {
                        items: form.map(formPart => {
                            return {
                                startLine: formPart.startLine,
                                endLine: formPart.endLine,
                                label: `${formPart.name} ${formPart.sequence ?? ''}`,
                            }
                        
                        }),
                        // color: '#ff0077',
                    },
                    // {
                    //     items: ebene2.map(formPart => {
                    //         return {
                    //             startLine: formPart.startLine,
                    //             endLine: formPart.endLine,
                    //             label: `${formPart.name} ${formPart.sequence ?? ''}`,
                    //         }
                    //     }),
                    //     color: 'rgba(255 0 0 / 0.4)',
                    // }
                ]"
                :lines="scoreOptions.showModulations ? [{
                    items: modulations.map(m => ({
                        lineNumber: m.startLine,
                        label: {
                            value: scoreOptions.showModulationsDegLabel ?`${m.deg} / ${m.key}` : m.key,
                            position: 'bottom',
                        },
                    })),
                    color: 'rgb(34 197 94 / 0.4)',
                }] : []"
                :filters="scoreOptions.humdrumFilters"
            />
            <!-- <pre v-text="ebene2"></pre>
            <pre v-text="form"></pre> -->
            <PieceForm :form="form" />

        </div>
    </UContainer>
</template>