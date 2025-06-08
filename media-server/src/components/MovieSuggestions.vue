<template>
    <v-container class="pa-5">
        <v-row dense>
            <v-col v-for="movie in movies" :key="movie.id" cols="12" sm="6" md="3">
                <v-hover v-slot="{ isHovering, props }">
                    <v-card v-bind="props" class="mb-5 movie-card" elevation="6" rounded="xl" color="white">
                        <v-img :src="movie.poster" height="300px" class="rounded-t-xl" cover>
                            <!-- Top-left year badge -->
                            <div class="badge year-badge">{{ movie.year || '2023' }}</div>

                            <!-- Top-right TV icon -->
                            <div class="badge icon-badge">
                                <v-icon size="18">mdi-television</v-icon>
                            </div>

                            <!-- Hover overlay with Watch Now button -->
                            <div class="hover-overlay" v-if="isHovering">
                                <v-btn color="cyan darken-2" size="small" rounded="pill"
                                    :loading="loadingMovie === movie.title" :disabled="loadingMovie === movie.title"
                                    @click.stop="downloadMovie(movie.title)">
                                    🎬 Watch Now
                                </v-btn>
                            </div>

                            <!-- Bottom-left rating -->
                            <div class="badge rating-badge">
                                ⭐ {{ movie.rating || '8.0' }}
                            </div>
                        </v-img>

                        <v-card-title class="text-center text-body-1 font-weight-bold">
                            {{ movie.title }}
                        </v-card-title>
                    </v-card>
                </v-hover>
            </v-col>
        </v-row>
    </v-container>
</template>
  
  
  
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const movies = ref<any[]>([])
const loadingMovie = ref<string | null>(null)


const truncate = (text: string, length: number) => {
    return text.length > length ? text.slice(0, length) + '…' : text
}


const fetchSuggestions = async () => {
    const res = await axios.get('http://localhost:3000/suggest/movies')

    // Add `year` and `rating` for use in card badges
    movies.value = res.data.map((m: any) => ({
        ...m,
        year: m.release_date ? m.release_date.slice(0, 4) : 'N/A',
        rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0'
    }))
}

const downloadMovie = async (title: string) => {
    try {
        loadingMovie.value = title // start spinner

        const fixedTitle = title.trim().toLowerCase().replace(/\s+/g, '+')

        const res = await axios.get('http://localhost:3000/stream123', {
            params: { title: fixedTitle }
        })

        const { videoFrame } = res.data

        if (videoFrame) {
            router.push({ path: '/watchPage', query: { title, videoFrame } })
        } else {
            alert('No stream found 😢')
        }
    } catch (err) {
        console.error('Error fetching stream:', err)
        alert('Failed to fetch streaming link 😢')
    } finally {
        loadingMovie.value = null // stop spinner
    }
}



onMounted(fetchSuggestions)
</script>

<style scoped>
.movie-card {
    position: relative;
    overflow: hidden;
}

.badge {
    position: absolute;
    z-index: 2;
    background-color: #ffffffee;
    padding: 4px 8px;
    font-size: 0.75rem;
    font-weight: bold;
    border-radius: 8px;
}

.year-badge {
    top: 8px;
    left: 8px;
    background-color: #1976d2;
    color: white;
}

.icon-badge {
    top: 8px;
    right: 8px;
    background-color: #424242;
    color: white;
}

.rating-badge {
    bottom: 8px;
    left: 8px;
    background-color: #43a047;
    color: white;
}

.hover-overlay {
    position: absolute;
    bottom: 8px;
    right: 8px;
    z-index: 2;
}

.border-img {
    border-top: 4px solid #9c27b0;
}

.neon-border {
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
}

.neon-border:hover {
    border-color: #7c4dff;
    box-shadow: 0 0 15px #7c4dffaa;
}

.neon-btn {
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 0 10px #7c4dff;
}
</style>
