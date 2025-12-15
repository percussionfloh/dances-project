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
    openScore.value = openScore.value === value ? null : value;0
}

const forms = formData.value.body;

</script>


<template>
    <UContainer>
        <Heading>{{ $t('Form') }}</Heading>

        <UTabs :items="tabItems">

            <template #minimap>
                HELLOOO
                <div class="grid grid-cols-1 gap-4">
                    <UCard v-for="piece in data">
                        <template #header>
                            <NuxtLink :to="localePath({ name: 'piece-id', params: { id: piece.slug } })">
                                <div class="flex">
                                    <div>
                                        {{ `${piece.composer}: ${piece.largerWorkTitle} №${piece.nr}` }}
                                    </div>
                                    <div class="ml-auto">
                                        {{ `Op. ${piece.op} № ${piece.nr}` }}
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


