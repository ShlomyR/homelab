<template>
    <v-container class="pa-5">
        <v-card outlined class="mb-3" v-for="file in files" :key="file">
            <v-card-title>{{ file }}</v-card-title>
            <v-card-actions>
                <v-btn :href="`http://localhost:3000/media/${file}`" target="_blank" download>Download</v-btn>
                <v-btn @click="playMedia(file)">Play</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const files = ref<string[]>([])

const fetchFiles = async () => {
    const res = await axios.get('http://localhost:3000/files')
    files.value = res.data
}

const playMedia = (file: string) => {
    const url = `http://localhost:3000/media/${file}`
    const audio = new Audio(url)
    audio.play()
}

onMounted(fetchFiles)
</script>
  