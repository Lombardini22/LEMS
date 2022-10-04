<template>
    <ion-infinite-scroll @ionInfinite="loadData($event)" threshold="100px" id="infinite-scroll" :disabled="isDisabled">
        <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Carico altri guest...">
        </ion-infinite-scroll-content>
    </ion-infinite-scroll>

</template>
  
<script lang="ts" setup>
import {
    InfiniteScrollCustomEvent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
} from '@ionic/vue';
import { ref, defineProps, defineEmits, computed, watch } from 'vue';

// prosps
const props = defineProps({
    allItems: {
        type: Array
    },
});

const allItems = computed(() => props.allItems);
watch(allItems, (newVal, oldVal) => {
    items.value = [];
    pushData();
});
const emit = defineEmits<{
    (e: 'moreData', items: any[]): void
}>()

const isDisabled = ref(false);

const toggleInfiniteScroll = () => {
    isDisabled.value = !isDisabled.value;
}
const items = ref<any[]>([]);

const pushData = () => {
    const max = items.value.length + 20;
    const min = max - 20;
    for (let i = min; i < max; i++) {
        const currentItem = allItems.value[i];
        if (currentItem) {
            items.value.push(currentItem);
        }
    }
    emit('moreData', items.value)
}

const loadData = (ev: InfiniteScrollCustomEvent) => {
    setTimeout(() => {
        pushData();
        // console.log('Loaded data');
        ev.target.complete();

        // App logic to determine if all data is loaded
        // and disable the infinite scroll
        if (items.value.length === 1000) {
            ev.target.disabled = true;
        }
    }, 500);
}

pushData();



</script>