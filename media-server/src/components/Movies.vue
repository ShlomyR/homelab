<template>
    <v-container class="pa-5">
        <v-text-field v-model="query" label="Search for a movie..." prepend-icon="mdi-magnify" @keyup.enter="searchMovies"
            clearable />
        <v-select v-model="selectedGenre" :items="genres" label="Filter by genre" clearable class="mb-4"
            prepend-icon="mdi-filter"></v-select>


        <v-row dense>
            <v-col v-for="movie in filteredMovies" :key="movie.title" cols="12" sm="6" md="3">
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
                                    @click.stop="openMovie(movie.title)">
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
const API = import.meta.env.VITE_API_URL

const router = useRouter()
const query = ref('')
const movies = ref<any[]>([])
const loadingMovie = ref<string | null>(null)
const selectedGenre = ref<string | null>(null)
const genres = ref<string[]>([])
// const selectedGenre = ref<string | null>(null)
// const genres = [
//   'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'
// ]


const fetchNewReleases = async () => {
  try {
    const res = await axios.get(`${API}/movies/discover`)

    console.log('📦 Response:', res.data)

    if (!Array.isArray(res.data)) {
      console.error('❌ Expected array, got:', res.data)
      return
    }

    movies.value = res.data
    extractGenres()
  } catch (err) {
    console.error('❌ Failed to fetch movies:', err)
    alert('Could not load new releases.')
  }
}

const extractGenres = () => {
    const allGenres = new Set<string>()
    movies.value.forEach(m => {
        (m.genres || []).forEach((g: string) => allGenres.add(g))
    })
    genres.value = [...allGenres].sort()
}

const filteredMovies = computed(() => {
    if (!selectedGenre.value) return movies.value
    return movies.value.filter(m => m.genres?.includes(selectedGenre.value))
})

const searchMovies = async () => {
    if (!query.value) return fetchNewReleases()
    const fixedQuery = query.value.trim().toLowerCase().replace(/\s+/g, '+')
    const res = await axios.get(`${API}/movies/search`, {
        params: { query: fixedQuery }
    })
    movies.value = res.data
}

const openMovie = async (title: string) => {
    try {
        loadingMovie.value = title // start spinner

        const fixedTitle = title.trim().toLowerCase().replace(/\s+/g, '+')

        const res = await axios.get(`${API}/stream123`, {
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


onMounted(fetchNewReleases)
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

  
  