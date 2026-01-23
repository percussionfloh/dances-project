<script setup>
const UButton = resolveComponent('UButton');

const { data } = await useAsyncData('pieces', () => queryCollection('pieces').all())
const { data: modulationsData } = await useAsyncData(`modulations`, () => queryCollection('data').path('/data/modulations').first(), {deep: false });

const { t } = useI18n();
const localePath = useLocalePath();

const columns = [
    { id: 'audio', cell: ({ row }) => `${row.getValue('localRawFile')}` },
    { id: 'opNr', header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: t('opNr'),
            icon: isSorted
            ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        });
    }, cell: ({ row }) => `${row.original.op} / ${row.original.nr}` },
    { accessorKey: 'largerWorkTitle', header: t('largerWorkTitle') },
    { accessorKey: 'title', header: t('title') },
    { accessorKey: 'key', header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: t('key'),
            icon: isSorted
            ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        });
    } },
    { accessorKey: 'majorMinor', header: ({ column }) => {
        const isSorted = column.getIsSorted();
        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: t('key'),
            icon: isSorted
            ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
            : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        });
    }, cell: (row) => t(row.getValue('majorMinor')) },
    { accessorKey: 'composer', header: t('composer') },
    { id: 'actions' },
];

const sorting = ref([
    {
        id: 'opNr',
        desc: false,
    },
]);

const defaultFilters = {
    deg: null,
    composer: null,
    genre: null,
};

const filters = reactive({ ...defaultFilters });

const filteredPieces = computed(() => {
    return data.value.filter(item => {
        let matchDeg = true;
        let matchComposer = true;
        let matchGenre = true;

        if (filters.deg) {
            const mods = modulationsData.value?.body?.[item.body?.slug] ?? [];
            matchDeg = mods.some(i => i.deg === filters.deg);
        }
        if (filters.composer) {
            matchComposer = item.composer === filters.composer;
        }
        if (filters.genre) {
            matchGenre = item.genre === filters.genre;
        }
        return matchDeg && matchComposer && matchGenre;
    });
});

const degItems = [...Object.values(modulationsData.value.body).reduce((acc, modulations) => {
	modulations.forEach(mod => acc.add(mod.deg));
	return acc;
}, new Set())];


const composerItems = [...new Set(data.value.map(p => p.composer))];

const genreItems = [...new Set(data.value.map(p => p.genre))];

function resetFilters() {
    for (const key in defaultFilters) {
		filters[key] = defaultFilters[key];
	}
}
</script>

<template>
    <UContainer>
        <div class="flex flex-col gap-8">
            <Heading>Stücke</Heading>
            <div class="grid grid-cols-4 gap-4">
                <UFormField :label="$t('deg')">
                    <USelect v-model="filters.deg" :items="degItems" class="w-full" />
                </UFormField>
                <UFormField :label="$t('composer')">
                    <USelect v-model="filters.composer" :items="composerItems" class="w-full" />
                </UFormField>
                <UFormField :label="$t('genre')">
                    <USelect v-model="filters.genre" :items="genreItems" class="w-full" />
                </UFormField>
                <UFormField label="&nbsp;">
                    <UButton @click="resetFilters">{{ $t('resetFilters') }}</UButton>
                </UFormField>
            </div>
            <UTable v-model:sorting="sorting" :data="filteredPieces" :columns="columns" class="mt-8">
                <template #audio-cell="{ row, cell, column }">
                    <MidiPlayer :url="row.original.localRawFile" class="text-2xl"/>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex gap-1 justify-end">
                        <UButton size="sm" color="primary" variant="solid" :label="t('vhv')" :to="`https://verovio.humdrum.org/?file=${encodeURIComponent(`https://github.com/WolfgangDrescher/schubert-dances/blob/master/kern/${row.original.filename}.krn`)}`" target="_blank" />
                        <UButton size="sm" color="primary" variant="solid" :label="t('view')" :to="localePath({ name: 'piece-id', params: { id: row.original.slug } })" />
                    </div>
                </template>
            </UTable>
        </div>
    </UContainer>
</template>
