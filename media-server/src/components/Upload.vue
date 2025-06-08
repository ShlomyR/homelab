<template>
    <v-container class="pa-5">
        <v-card outlined class="pa-10" @drop.prevent="onDrop" @dragover.prevent>
            <v-card-title>Drop or Paste Files Here</v-card-title>
            <v-card-subtitle>Supports drag-and-drop and Ctrl+V</v-card-subtitle>
        </v-card>
    </v-container>
</template>
  
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
const API = import.meta.env.VITE_API_URL

const onDrop = async (event: DragEvent) => {
    const files = event.dataTransfer?.files
    if (files && files.length) {
        await uploadFiles(files)
    }
}

const uploadFiles = async (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('files', file))
    await axios.post(`${API}/upload`, formData)
}

onMounted(() => {
    window.addEventListener('paste', async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return
        const files:any = Array.from(items)
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter(Boolean) as File[]
        if (files.length) await uploadFiles(files as FileList)
    })
})
</script>
  