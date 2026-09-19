import { useEffect, useState } from 'react'
import './App.css'

function App() {
    const [collections, setCollections] = useState([])
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [sharedCollection, setSharedCollection] = useState(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const shareId = params.get('share')

        if (shareId) {
            loadSharedCollection(shareId)
        } else {
            loadCollections()
        }
    }, [])

    async function loadCollections() {
        const response = await fetch('http://localhost:3000/collections')
        const data = await response.json()
        setCollections(data)
    }

    async function loadSharedCollection(shareId) {
        const response = await fetch(
            `http://localhost:3000/shared/${shareId}`
        )

        if (!response.ok) {
            alert('shared collection not found')
            return
        }

        const data = await response.json()
        setSharedCollection(data)
    }

    async function searchImages(event) {
        event.preventDefault()

        if (!query.trim()) return

        setSearching(true)

        try {
            const response = await fetch(
                `http://localhost:3000/search?q=${encodeURIComponent(query)}`
            )

            const data = await response.json()
            setSearchResults(data)
        } finally {
            setSearching(false)
        }
    }

    async function createCollection() {
        const name = prompt('name your new collection:')
        if (!name) return

        await fetch('http://localhost:3000/collections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        })

        loadCollections()
    }

    async function saveImage(image) {
        if (collections.length === 0) {
            alert('create a collection first!')
            return
        }

        const collectionNames = collections
            .map(
                (collection, index) =>
                    `${index + 1}. ${collection.name}`
            )
            .join('\n')

        const choice = prompt(
            `where should we save this?\n\n${collectionNames}\n\nenter a number:`
        )

        const collection = collections[Number(choice) - 1]

        if (!collection) return

        await fetch(
            `http://localhost:3000/collections/${collection.id}/images`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: image.url,
                    title: image.title
                })
            }
        )

        loadCollections()
    }

    async function deleteCollection(id) {
        const confirmed = confirm('Delete this collection?')
        if (!confirmed) return

        await fetch(
            `http://localhost:3000/collections/${id}`,
            {
                method: 'DELETE'
            }
        )

        loadCollections()
    }

    async function editImage(collectionId, image) {
        const title = prompt('Edit the title:', image.title)
        if (!title) return

        await fetch(
            `http://localhost:3000/collections/${collectionId}/images/${image.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            }
        )

        loadCollections()
    }

    async function deleteImage(collectionId, imageId) {
        await fetch(
            `http://localhost:3000/collections/${collectionId}/images/${imageId}`,
            {
                method: 'DELETE'
            }
        )

        loadCollections()
    }

    async function shareCollection(id) {
        const response = await fetch(
            `http://localhost:3000/collections/${id}/share`,
            {
                method: 'POST'
            }
        )

        if (!response.ok) {
            alert('could not create share link')
            return
        }

        const data = await response.json()

        const shareLink =
            `${window.location.origin}/?share=${data.shareId}`

        await navigator.clipboard.writeText(shareLink)

        alert('share link copied!')
    }

    function scrollToCollections() {
        document
            .getElementById('collections')
            .scrollIntoView({ behavior: 'smooth' })
    }

    // Shared collection page
    if (sharedCollection) {
        return (
            <div className="app">
                <nav className="nav">
                    <div className="logo">collect.</div>

                    <div className="nav-links">
                        <button
                            className="new-button"
                            onClick={() => {
                                window.location.href = '/'
                            }}
                        >
                            back home
                        </button>
                    </div>
                </nav>

                <main>
                    <section className="collections-section">
                        <div className="section-heading">
                            <div>
                                <p className="section-label">
                                    SHARED COLLECTION
                                </p>

                                <h2>{sharedCollection.name}</h2>
                            </div>
                        </div>

                        {sharedCollection.images.length === 0 ? (
                            <div className="empty">
                                <div className="empty-symbol">♡</div>
                                <h3>nothing here yet.</h3>
                            </div>
                        ) : (
                            <div className="masonry">
                                {sharedCollection.images.map(image => (
                                    <article
                                        className="discover-card"
                                        key={image.id}
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.title}
                                        />
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                <footer>
                    <div className="logo">collect.</div>
                    <p>shravya eyunni ♡</p>
                </footer>
            </div>
        )
    }

    return (
        <div className="app">
            <nav className="nav">
                <div className="logo">collect.</div>

                <div className="nav-links">
                    <button
                        className="nav-link"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            })
                        }
                    >
                        discover
                    </button>

                    <button
                        className="nav-link"
                        onClick={scrollToCollections}
                    >
                        collections
                    </button>

                    <button
                        className="new-button"
                        onClick={createCollection}
                    >
                        + new collection
                    </button>
                </div>
            </nav>

            <main>
                <section className="hero">
                    <div className="hero-heart">♡</div>

                    <h1>
                        collect something
                        <br />
                        <span>worth loving.</span>
                    </h1>

                    <p className="hero-copy">
                        search for inspiration and collect the things
                        you love in one beautiful place!
                    </p>

                    <form
                        className="search-bar"
                        onSubmit={searchImages}
                    >
                        <span className="search-icon">⌕</span>

                        <input
                            type="text"
                            placeholder="search places, food, fashion, ideas..."
                            value={query}
                            onChange={event =>
                                setQuery(event.target.value)
                            }
                        />

                        <button type="submit">
                            {searching
                                ? 'searching...'
                                : 'search'}
                        </button>
                    </form>
                </section>

                {searchResults.length > 0 && (
                    <section className="discover-section">
                        <div className="section-heading">
                            <div>
                                <p className="section-label">
                                    DISCOVER
                                </p>

                                <h2>{query}</h2>
                            </div>

                            <p className="pixabay">
                                imagery via Pixabay
                            </p>
                        </div>

                        <div className="masonry">
                            {searchResults.map(image => (
                                <article
                                    className="discover-card"
                                    key={image.id}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.title}
                                    />

                                    <div className="image-hover">
                                        <button
                                            onClick={() =>
                                                saveImage(image)
                                            }
                                        >
                                            save
                                        </button>
                                    </div>

                                    <div className="photo-credit">
                                        {image.photographer}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section
                    className="collections-section"
                    id="collections"
                >
                    <div className="section-heading collections-heading">
                        <div>
                            <p className="section-label">
                                YOUR SPACE
                            </p>

                            <h2>my collections</h2>
                        </div>

                        <button
                            className="outline-button"
                            onClick={createCollection}
                        >
                            + create collection
                        </button>
                    </div>

                    {collections.length === 0 ? (
                        <div className="empty">
                            <div className="empty-symbol">
                                ♡
                            </div>

                            <h3>nothing here yet.</h3>

                            <p>
                                start a collection and save a
                                little inspiration for later!
                            </p>

                            <button onClick={createCollection}>
                                create my first collection
                            </button>
                        </div>
                    ) : (
                        <div className="collection-list">
                            {collections.map(collection => (
                                <article
                                    className="collection"
                                    key={collection.id}
                                >
                                    <div className="collection-top">
                                        <div>
                                            <p className="collection-count">
                                                {
                                                    collection
                                                        .images
                                                        .length
                                                }{' '}
                                                {collection.images
                                                    .length === 1
                                                    ? 'SAVE'
                                                    : 'SAVES'}
                                            </p>

                                            <h3>
                                                {
                                                    collection.name
                                                }
                                            </h3>
                                        </div>

                                        <div className="collection-actions">
                                            <button
                                                className="share-collection"
                                                onClick={() =>
                                                    shareCollection(
                                                        collection.id
                                                    )
                                                }
                                            >
                                                share
                                            </button>

                                            <button
                                                className="delete-collection"
                                                onClick={() =>
                                                    deleteCollection(
                                                        collection.id
                                                    )
                                                }
                                            >
                                                delete
                                            </button>
                                        </div>
                                    </div>

                                    {collection.images.length ===
                                    0 ? (
                                        <button
                                            className="empty-collection"
                                            onClick={() =>
                                                window.scrollTo({
                                                    top: 0,
                                                    behavior:
                                                        'smooth'
                                                })
                                            }
                                        >
                                            <span>+</span>
                                            find something to save
                                        </button>
                                    ) : (
                                        <div className="saved-grid">
                                            {collection.images.map(
                                                image => (
                                                    <div
                                                        className="saved-card"
                                                        key={
                                                            image.id
                                                        }
                                                    >
                                                        <div className="saved-image">
                                                            <img
                                                                src={
                                                                    image.url
                                                                }
                                                                alt={
                                                                    image.title
                                                                }
                                                            />

                                                            <div className="saved-actions">
                                                                <button
                                                                    onClick={() =>
                                                                        editImage(
                                                                            collection.id,
                                                                            image
                                                                        )
                                                                    }
                                                                >
                                                                    edit
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        deleteImage(
                                                                            collection.id,
                                                                            image.id
                                                                        )
                                                                    }
                                                                >
                                                                    remove
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p>
                                                            {
                                                                image.title
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <footer>
                <div className="logo">collect.</div>
                <p>shravya eyunni ♡ </p>
            </footer>
        </div>
    )
}

export default App