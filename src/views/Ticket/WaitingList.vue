<template>
    <h1 id="believers" class="pad-20">Waiting List!</h1>
    <p>
        Grazie per aver richiesto di partecipare al Christmas Party di Lombardini22!
        <br />
        <br />
        Al momento purtroppo sono terminati i posti disponibili in Triennale.<br />
        <br />
        Stiamo facendo tutto il possibile per poterti confermare la partecipazione!<br />
        <br />
        Riceverai presto nostre notizie,<br />
        Grazie!
    </p>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue';
import { snow } from '../utils/confetti'

onMounted(() => {
    snow()
})
</script>
<style>
#block {
  background-color: #00265181 !important;
  color: white !important;
}

</style>