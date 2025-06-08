<template>
    <v-container class="pa-5">
        <v-card>
            <v-card-title>Now Playing: {{ title }}</v-card-title>
            <v-card-text>
                <iframe v-if="videoFrame" :src="videoFrame" width="100%" height="500" frameborder="0" allowfullscreen />
                <p v-else>No stream available</p>
            </v-card-text>
        </v-card>
    </v-container>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps<{ title: string }>()
const videoFrame = ref<string | null>(null)

onMounted(async () => {
    const res = await axios.get('http://localhost:3000/stream123', {
        params: { title: props.title }
    })
    videoFrame.value = res.data.videoFrame
})
</script>
  