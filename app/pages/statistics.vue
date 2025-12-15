<script setup>
const { data } = await useAsyncData('pieces', () => queryCollection('pieces').all())
const { data: modulationsData } = await useAsyncData(`modulations`, () => queryCollection('data').path('/data/modulations').first(), {deep: false });
const { data: transitionsData } = await useAsyncData(`transitions`, () => queryCollection('data').path('/data/transitions').first(), {deep: false });
const localePath = useLocalePath();

const { t } = useI18n();

</script>