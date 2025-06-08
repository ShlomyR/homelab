// server/index.ts
import express, { Request, Response } from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000
const VITE_API_URL= 'http://localhost:3001/homelab'
const TMDB_API_KEY = '22b663590001e9c675232f0c24000ad2'

app.use(cors())
app.use('/media', express.static(path.join(__dirname, 'uploads')))

const upload = multer({ dest: 'uploads/' })
const browser = await puppeteer.launch({
  headless: false, // or `'new' as any` if needed
  args: ['--no-sandbox']
})

const page = await browser.newPage()

// 👇 Spoof the browser to bypass protection
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
)

// 👇 Just to be explicit (usually on by default)
await page.setJavaScriptEnabled(true)

// 👇 Now navigate
await page.goto('https://123moviesminia.com/movies', { waitUntil: 'domcontentloaded' })


app.post('/upload', upload.array('files'), (req: any, res: any) => {
  res.status(200).json({ message: 'Files uploaded!' })
})

app.get('/files', (req, res) => {
  const dirPath = path.join(__dirname, 'uploads')
  fs.readdir(dirPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' })
    res.json(files)
  })
})

app.get('/movies/discover', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()

  try {
    await page.goto('https://123moviesminia.com/movies', { waitUntil: 'domcontentloaded' })

    const movies: any = await page.$$eval('div.col .card.border-0.shadow a', anchors =>
      anchors.map(a => ({
        title: (a.querySelector('img')?.getAttribute('alt') || '').trim(),
        poster: a.querySelector('img')?.getAttribute('data-src') || '',
        link: 'https://123moviesminia.com' + (a as HTMLAnchorElement).getAttribute('href')
      }))
    )

    const topMovies = movies.slice(0, 12) // limit for speed
    console.log('topMovies:',topMovies)

    for (const movie of topMovies) {
      await page.goto(movie.link, { waitUntil: 'domcontentloaded' })

      const genres = await page.$$eval('.elements .meta .genres a', nodes =>
        nodes.map(el => el.textContent?.trim() || '')
      )

      movie.genres = genres
      console.log('movie.genres:',movie.genres)
    }

    res.json(topMovies)
  } catch (e) {
    console.error('Genre scraping failed:', e)
    res.status(500).json({ error: 'Failed to fetch movies' })
  } finally {
    await browser.close()
  }
})

app.get('/movies/search', async (req, res) => {
  const { query } = req.query
  if (!query) return res.status(400).json({ error: 'Missing query' })

  const searchUrl = `https://123moviesminia.com/search/${query}`

  const response = await axios.get(searchUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })

  const $ = cheerio.load(response.data)
  const results:any = []

  $('div.col .card.border-0.shadow a').each((_, el) => {
    const title = $(el).find('img').attr('alt') || 'Unknown'
    const poster = $(el).find('img').attr('data-src') || ''
    const link = 'https://123moviesminia.com' + $(el).attr('href')
    results.push({ title, poster, link })
  })

  res.json(results)
})


app.get('/suggest/movies', async (req, res) => {
  try {
    const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    })

    // Return only basic info for now
    const suggestions = response.data.results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    }))

    res.json(suggestions)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suggestions' })
  }
})

app.get('/stream123', async (req, res) => {
  const { title } = req.query
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing title' })
  }

  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Step 1: Search and go to first movie
    const searchUrl = `https://123moviesminia.com/search/${encodeURIComponent(title)}`
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })

    await page.waitForSelector('div.col .card.border-0.shadow a', { timeout: 7000 })

    const results = await page.$$eval('div.col .card.border-0.shadow a', anchors =>
      anchors.map(a => ({
        title: (a.querySelector('img')?.getAttribute('alt') || '').trim().toLowerCase(),
        link: 'https://123moviesminia.com' + (a as HTMLAnchorElement).getAttribute('href')
      }))
    )

    console.log('results:',results)

    const normalizedInput = title.toLowerCase().replace(/\s+/g, '')

    let selected = results.find(r => r.title.replace(/\s+/g, '') === normalizedInput)

    if (!selected && results.length) {
      selected = results[0]
    }

    if (!selected) {
      throw new Error('No matching result found')
    }

    const firstMovieLink = selected.link


    await page.goto(firstMovieLink, { waitUntil: 'domcontentloaded' })

    // Step 2: Click "Play Now"
    await page.waitForSelector('#play-now', { timeout: 7000 })
    await page.click('#play-now')

    // Wait for any iframes to appear
    await new Promise(resolve => setTimeout(resolve, 4000))

    // Step 3: Collect all iframe URLs
    const frameUrls = await page.$$eval('iframe', iframes =>
      iframes.map(f => (f as HTMLIFrameElement).src)
    )

    console.log('🧩 Found iframe URLs:', frameUrls)

    // Step 4: Try to pick a valid stream iframe (best guess)
    const likelyStream = frameUrls.find(url =>
      /vidsrc|player|embed|stream/.test(url)
    )

    res.json({
      streamPage: firstMovieLink,
      videoFrame: likelyStream ?? null,
      allCandidates: frameUrls
    })
  } catch (err) {
    console.error('❌ Puppeteer error:', err)
    res.status(500).json({ error: 'Failed to extract iframe URLs' })
  } finally {
    await browser.close()
  }
})



app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`)
})
