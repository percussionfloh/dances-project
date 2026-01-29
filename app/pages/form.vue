<script setup>
const { data } = await useAsyncData('pieces', () => queryCollection('pieces').all())
const { data: formData } = await useAsyncData(`form`, () => queryCollection('data').path('/data/form').first(), {deep: false });
const localePath = useLocalePath();

const { t } = useI18n();

const tabItems = [
    {
        slot: 'minimap',
        label: t('minimap'),
        icon: 'i-heroicons-map',
    }];

const options = reactive({
    showKeys: false,
});

const openScore = ref(null);
function toggleScore(value) {
    openScore.value = openScore.value === value ? null : value;
}

const forms = formData.value.body;

const defaultFilters = {
    deg: null,
    composer: null,
    genre: null,
};

const filters = reactive({ ...defaultFilters });

const filteredPieces = computed(() => {
    return data.value.filter(item => {
        let matchComposer = true;
        if (filters.composer) {
            matchComposer = item.composer === filters.composer;
        }
        return matchDeg && matchComposer && matchGenre;
    });
});


const composerItems = [...new Set(data.value.map(p => p.composer))];


</script>


<template>
    <UContainer>
        <Heading>{{ $t('Form') }}</Heading>
             <div class="grid grid-cols-4 gap-4">
                <UFormField :label="$t('composer')">
                    <USelect v-model="filters.composer" :items="composerItems" class="w-full" />
                </UFormField>
            </div>

        <UTabs :items="tabItems">

            <template #minimap>
                <div class="grid grid-cols-1 gap-4">
                    <UCard v-for="piece in data">
                        <template #header>
                            <NuxtLink :to="localePath({ name: 'piece-id', params: { id: piece.slug } })">
                                <div class="flex">
                                    <div>
                                        {{ piece.op && piece.nr ? `Op. ${piece.op} № ${piece.nr}` : piece.title }}
                                    </div>
                                    <div class="ml-auto">
                                         {{ `${piece.composer}: ${piece.largerWorkTitle}${piece.nr ? ` №${piece.nr}` : ''}` }}
                                    </div>
                                </div>
                            </NuxtLink>
                        </template>
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <div class="flex gap-2 justify-end items-center mb-2">
                                    <div>
                                        <MidiPlayer :url="piece.localRawFile" class="text-2xl"/>
                                    </div>
                                    <UButton @click="toggleScore(piece.slug)" variant="soft">
                                        {{ openScore === piece.slug ? $t('hideScore') : $t('showScore') }}
                                    </UButton>
                                </div>
                                <div>
                                    <VerovioCanvas v-if="openScore === piece.slug" view-mode="horizontal" :url="piece.localRawFile" :scale="35" :page-margin="20" />
                                </div>
                            </div>
                            <PieceForm v-if="forms?.[piece.slug]" :form="forms[piece.slug]"/>
                        </div>
                    </UCard>
                </div>
            </template>
        </UTabs>
    </UContainer>
</template>


