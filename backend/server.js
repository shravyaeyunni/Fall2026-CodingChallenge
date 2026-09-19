require('dotenv').config()

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3000
const DATA_FILE = path.join(__dirname, 'data.json')

app.use(cors())
app.use(express.json())

// Load saved collections
let collections = []

try {
    const savedData = fs.readFileSync(DATA_FILE, 'utf8')
    collections = JSON.parse(savedData)
} catch (error) {
    collections = []
}

function saveCollections() {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(collections, null, 2)
    )
}

// Get all collections
app.get('/collections', (req, res) => {
    res.json(collections)
})

// Create a collection
app.post('/collections', (req, res) => {
    const newCollection = {
        id: Date.now().toString(),
        name: req.body.name,
        images: []
    }

    collections.push(newCollection)
    saveCollections()

    res.json(newCollection)
})

// Delete a collection
app.delete('/collections/:id', (req, res) => {
    collections = collections.filter(
        collection => collection.id !== req.params.id
    )

    saveCollections()

    res.json({ message: 'Collection deleted' })
})

// Add an image
app.post('/collections/:id/images', (req, res) => {
    const collection = collections.find(
        collection => collection.id === req.params.id
    )

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found'
        })
    }

    const newImage = {
        id: Date.now().toString(),
        url: req.body.url,
        title: req.body.title
    }

    collection.images.push(newImage)
    saveCollections()

    res.json(newImage)
})

// Edit image title
app.put('/collections/:collectionId/images/:imageId', (req, res) => {
    const collection = collections.find(
        collection => collection.id === req.params.collectionId
    )

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found'
        })
    }

    const image = collection.images.find(
        image => image.id === req.params.imageId
    )

    if (!image) {
        return res.status(404).json({
            message: 'Image not found'
        })
    }

    image.title = req.body.title
    saveCollections()

    res.json(image)
})

// Delete image
app.delete('/collections/:collectionId/images/:imageId', (req, res) => {
    const collection = collections.find(
        collection => collection.id === req.params.collectionId
    )

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found'
        })
    }

    collection.images = collection.images.filter(
        image => image.id !== req.params.imageId
    )

    saveCollections()

    res.json({ message: 'Image deleted' })
})

// Search Pixabay
app.get('/search', async (req, res) => {
    const query = req.query.q

    if (!query) {
        return res.status(400).json({
            message: 'Search term required'
        })
    }

    try {
        const url =
            `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}` +
            `&q=${encodeURIComponent(query)}` +
            `&image_type=photo&safesearch=true&per_page=18`

        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
            return res.status(response.status).json({
                message: 'Pixabay search failed'
            })
        }

        const images = data.hits.map(image => ({
            id: image.id,
            url: image.webformatURL,
            title: image.tags,
            photographer: image.user,
            pageURL: image.pageURL
        }))

        res.json(images)
    } catch (error) {
        res.status(500).json({
            message: 'Image search failed'
        })
    }
})

// Create a share link
app.post('/collections/:id/share', (req, res) => {
    const collection = collections.find(
        collection => collection.id === req.params.id
    )

    if (!collection) {
        return res.status(404).json({
            message: 'Collection not found'
        })
    }

    if (!collection.shareId) {
        collection.shareId =
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 8)

        saveCollections()
    }

    res.json({
        shareId: collection.shareId
    })
})

// Get a shared collection
app.get('/shared/:shareId', (req, res) => {
    const collection = collections.find(
        collection => collection.shareId === req.params.shareId
    )

    if (!collection) {
        return res.status(404).json({
            message: 'Shared collection not found'
        })
    }

    res.json(collection)
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})