<template>
    <v-container>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const title = route.query.title?.toString() || 'Unknown Movie'
const videoFrame = route.query.videoFrame?.toString() || ''
</script>
  