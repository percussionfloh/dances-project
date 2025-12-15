<script setup>
const props = defineProps({
    form: {
        type: Array,
        required: true,
    }
});

const form = props.form || [];

const maxBeat = form[form.length - 1]?.endBeat ?? 0;

function getWidth(startBeat, endBeat) {
    return (endBeat - startBeat) / maxBeat * 100;
}
function getLeft(startBeat) {
    return startBeat / maxBeat * 100;
}

</script>

<template>
    <div class="relative h-12">
        <div v-for="part in form" class="absolute h-full" :style="{
            width: `${getWidth(part.startBeat, part.endBeat)}%`,
            left: `${getLeft(part.startBeat)}%`,
        }">
            <UTooltip :text="part.name">
                <div class="w-full h-full bg-gray-200 rounded px-2 flex items-center hover:bg-primary-400 hover:shadow">
                    {{ part.name }}
                </div>
            </UTooltip>
        </div>
    </div>
</template>
    

