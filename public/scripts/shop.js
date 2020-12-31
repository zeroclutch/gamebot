const getShopItem = (item) => {
    return `<div class="item-holder column is-6 is-12-tablet is-4-widescreen">
                <div class="item columns is-multiline is-mobile">
                <div class="item-image column is-4-mobile is-3-tablet is-12-desktop" style="background-image: url('/shop-items/${item.game}-shop/${item.image || item.type + '.png'}')">
                </div>
                <div class="column">
                    <div class="item-info columns is-mobile">
                        <div class="item-name column">${item.friendlyName}</div>
                        <div class="item-cost column has-text-right">
                        ${item.cost > 0 ? `${item.cost}<img class="currency-icon" src="/images/currency/credit.png">` : ''}
                        ${item.goldCost > 0 ? `${item.goldCost}<img class="currency-icon" src="/images/currency/coin.gif">` : ''}
                        </div>
                        </div>
                    <div class="item-description">
                        ${item.description}
                    </div>
                    <div class="item-buttons has-text-right">
                        ${item.purchased ? 
                            `<button disabled class="item-button info-button button is-success">Purchased</button>` :
                        `<a onclick="moreInfo('${item.itemID}')" class="item-button info-button button is-light">More info</a>
                        <a onclick="buy('${item.itemID}')" data-item="${item.itemID}" class="item-button is-buy button">Buy now</a>`
                        }
                    </div>
                </div>
            </div>
            </div>`
}

const getPresentationItem = (item) => {
    return `<div class="item-holder column is-6">
                <div class="item columns is-multiline is-mobile">
                <div class="item-image column is-4-mobile is-3-tablet is-12-desktop" style="background-image: url('/shop-items/${item.game}-shop/${item.image || item.type + '.png'}')">
                </div>
                <div class="column">
                    <div class="item-info columns is-mobile">
                        <div class="item-name column">${item.friendlyName}</div>
                        <div class="item-cost column has-text-right">
                        ${item.cost > 0 ? `${item.cost}<img class="currency-icon" src="/images/currency/credit.png">` : ''}
                        ${item.goldCost > 0 ? `${item.goldCost}<img class="currency-icon" src="/images/currency/coin.gif">` : ''}
                        </div>
                        </div>
                    <div class="item-description">
                        ${item.description}
                    </div>
                    <div class="item-buttons has-text-right">
                        ${item.purchased ? 
                            `<button disabled class="item-button info-button button is-success">Purchased</button>` :
                        `<a onclick="moreInfo('${item.itemID}')" class="item-button info-button button is-light">More info</a>
                        <a onclick="buy('${item.itemID}')" data-item="${item.itemID}" class="item-button is-buy button">Buy now</a>`
                        }
                    </div>
                </div>
            </div>
            </div>`
}

const getShopModal = (item) => {
    return `<div class="box">
                <div class="item">
                <div class="item-image" style="background-image: url('/shop-items/${item.game}-shop/${item.image || item.type + '.png'}')">
                </div>
                <div class="">
                    <div class="item-info columns is-mobile">
                        <div class="item-name column">${item.friendlyName}</div>
                        <div class="item-cost column has-text-right">
                        ${item.cost > 0 ? `${item.cost}<img class="currency-icon" src="/images/currency/credit.png">` : ''}
                        ${item.goldCost > 0 ? `${item.goldCost}<img class="currency-icon" src="/images/currency/coin.gif">` : ''}
                        </div>
                        </div>
                    <div class="item-description">
                        ${item.description}
                    </div>
                    <div class="item-buttons has-text-right">
                        ${item.purchased ? 
                            `<button disabled class="item-button info-button button is-success">Purchased</button>` :
                        `<a onclick="closeModals()" class="item-button cancel-button button is-light">Cancel</a>
                        <a onclick="buy('${item.itemID}')" data-item="${item.itemID}" class="item-button is-buy button">Buy now</a>`
                        }
                    </div>
                </div>
            </div>
            </div>`
}

const $ = selector => document.querySelector(selector)

let textFilter = '',
    sortBy = 'price',
    sortOrder = 'ascending',
    gameFilter = 'All Items',
    categoryFilter = '',
    shopItems,
    shopStatus,
    accessToken,
    userID

const games = {
    'Anagrams': 'ana',
    'Cards Against Humanity': 'cah',
    'Chess': 'che',
    'Survey Says': 'sus',
    'Wisecracks': 'wis'
}

const updateData = async (filters) => {
    let trendingItems = $('#trending-items')
    let topSellers = $('#top-sellers')

    shopStatus.trending.forEach(async id => {
        let item = await shopItems.find(item => item.itemID === id)
        trendingItems.innerHTML += getPresentationItem(item)
    })
    
    shopStatus.top.forEach(async id => {
        let item = await shopItems.find(item => item.itemID === id)
        topSellers.innerHTML += getPresentationItem(item)
    })

    let shopElement = document.getElementById('shop-items')
    let filterResults = document.getElementById('filter-results')
    let items = shopItems
    // Filter
    // Get game filter
    if(gameFilter !== 'All Items') {
        items = items.filter(item => item.game === games[gameFilter])
    }

    // Get category filter
    if(categoryFilter) {
        items = items.filter(item => item.type === categoryFilter)
    }
    
    // Get search filter
    if(textFilter) {
        let search = new RegExp(textFilter, 'gi')
        items = items.filter(item => search.test(item.name) || search.test(item.description) || search.test(item.type))
    }
    // Sort
    if(sortBy === 'price') {
        items.sort((a, b) => {
            return (a.cost >= b.cost) ? 1 : -1
        })
    } else {
        // Default to name
        items.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName))
    }

    if(sortOrder === 'descending') {
        items.reverse()
    }

    // Convert to HTML
    shopElement.innerHTML = ''
    trendingItems.innerHTML = ''
    topSellers.innerHTML = ''
    items = items.map(item => {
        return getShopItem(item)
    })
    shopElement.innerHTML = items.join('')
    filterResults.innerText = `${items.length} item${items.length == 1 ? '' : 's'} found`
}

const getGame = id => {
    return Object.keys(games).find(key => games[key] === id);
}

const moreInfo = id => {
    let item = shopItems.find(item => item.itemID == id)
    $('#more-info-modal.modal .modal-card').innerHTML = getShopModal(item)
    // Enable modal
    $('#more-info-modal.modal').classList.add('is-active')
}

const currencyInfo = () => {
    $('#currency-modal.modal').classList.add('is-active')
}

const selectRandom = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

const buy = id => {
    let item = shopItems.find(item => item.itemID == id)
    // Populate modal
    $('#buy-confirm-modal .modal-card-title').innerText = 'Confirm Purchase'
    $('#buy-confirm-modal .modal-card-body .item-description').innerHTML = `Are you sure you want to buy <b>${item.friendlyName}</b> for <b>${item.cost > 0 ? `${item.cost}<span class="icon"><img class="currency-icon" src="/images/currency/credit.png"></span>` : ''}${item.goldCost > 0 ? `${item.goldCost}<span class="icon"><img class="currency-icon" src="/images/currency/coin.gif"></span>` : ''}</b>?`
    $('#buy-confirm-modal .button.is-success').setAttribute('onclick', `confirmBuy('${id}')`)
    // Enable modal
    $('#buy-confirm-modal.modal').classList.add('is-active')
}

const confirmBuy = async itemID => {
    // Check for user login
    if(!getCookie('session-token')) {
        window.location = '/login'
        return
    }

    const data = {
        itemID,
        userID
    }

    $('#buy-confirm-modal.modal .button.is-success').classList.add('is-loading')

    // POST to backend
    const request = await fetch('/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    })

    const response = await request.json()
    $('#buy-confirm-modal.modal .button.is-success').classList.remove('is-loading')

    // if error, display in modal
    if(response.error || !response.item || !response.remainingBalance && response.remainingBalance !== 0) {
        closeModals()
        // Populate modal
        $('#purchase-confirm-modal .modal-card-title').innerText = 'Purchase unsuccessful'
        $('#purchase-confirm-modal .modal-card-body .item-description').innerText = response.error || 'Something went wrong while purchasing, please try again later.'
        $('#purchase-confirm-modal .button.is-info').innerText = 'OK'
        // Enable modal
        $('#purchase-confirm-modal.modal').classList.add('is-active')
    } else {
    // if success, display in modal and refresh shop items
        closeModals()
        // Populate modal
        $('#purchase-confirm-modal .button.is-info').innerText = selectRandom(['Sweeeet', 'Niiice', 'Siiick', 'Tiiight', 'Cooool'])
        $('#purchase-confirm-modal .modal-card-title').innerText = 'Purchase success'
        $('#purchase-confirm-modal .modal-card-body .item-description').innerHTML = `You have successfully bought ${response.item}. You now have ${response.remainingBalance}<span class="icon"><img class="currency-icon" src="/images/currency/credit.png"></span>`
        // Enable modal
        $('#purchase-confirm-modal.modal').classList.add('is-active')
    }
    updateShop()
}

const updateShop = () => {
    // Update shop
    fetch(`/shopItems${userID ? '?userID=' + userID : ''}`,{
        headers: {
            authorization: `Bearer ${accessToken}`
        }
    }).then(async res => {
        let data = await res.json()
        shopItems = data.items
        shopStatus = data.shopStatus

        $('#credit-balance').innerText = data.balance

        // Get categories
        let categories = []
        shopItems.forEach(item => {
            // Convert id to game name
            let game = getGame(item.game)
            let category = categories.find(category => category.game == game)
            if(!category) {
                categories.push({game, types: [item.type]})
            } else if(!category.types.includes(item.type)) {
                category.types.push(item.type)
            }
        })

        // Sort categories A-Z
        categories.sort((a, b) => a.game.localeCompare(b.game))

        // Generate sidebar
        let menuList = document.getElementById('menu-list-items')
        menuList.innerHTML = ''
        categories.forEach(category => {
            category.types.sort((a, b) => a.localeCompare(b))
            let listItem = document.createElement('li')
            let link = document.createElement('a')
            let gameText = document.createTextNode(category.game)
            link.appendChild(gameText)

            let subList = document.createElement('ul')

            for(let i = 0; i < category.types.length; i++){
                let type = category.types[i],
                    subListItem = document.createElement('li')
                    subListLink = document.createElement('a')
                    subListLabel = document.createTextNode(type)
                subListLink.setAttribute('data-game', category.game)
                subListLink.appendChild(subListLabel)
                subListItem.appendChild(subListLink)
                subList.appendChild(subListItem)
            }
            listItem.appendChild(link)
            listItem.appendChild(subList)
            menuList.appendChild(listItem)
        })

        const listItems = $('#menu-list > li > a, #menu-list-items > li > a')
        listItems.classList.add('is-active')
        gameFilter = listItems.innerText

        document.querySelectorAll('#menu-list > li > a, #menu-list-items > li > a').forEach(el => {
            el.addEventListener('click', e => {
                document.querySelector('#menu-list li a.is-active').classList.remove('is-active')
                e.target.classList.add('is-active')
                gameFilter = e.target.innerText
                categoryFilter = ''
                document.getElementById('search-bar').value = ''
                textFilter = ''
                updateData()
            })
        })
        
        document.querySelectorAll('#menu-list li > ul a').forEach(el => {
            el.addEventListener('click', e => {
                document.querySelector('#menu-list li a.is-active').classList.remove('is-active')
                e.target.classList.add('is-active')
                gameFilter = e.target.dataset.game
                categoryFilter = e.target.innerText
                document.getElementById('search-bar').value = ''
                textFilter = ''
                updateData()
            })
        })

        updateData()
    }).catch(err => {
        console.error(err);
        // Populate webpage with error content
    })
}

const deleteCookie = (name) => {
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

const getCookie = name => {
    let row = document.cookie.split('; ').find(row => row.startsWith(name))

    if (row) {
        return row.split('=')[1]
    } else {
        return false
    }
}

const logout = () => {
    deleteCookie('session-token')
    window.location.reload()
}

document.addEventListener('DOMContentLoaded', async e => {
    accessToken = getCookie('session-token')

    if(accessToken) {
        let res = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${accessToken}`
            }
        }).catch(console.error)
        let response = await res.json()
        // Populate button
        $('.logged-out-wrapper').classList.add('is-hidden')
        $('.logged-in-wrapper').classList.remove('is-hidden')
        $('.overlay-profile-picture').src = `https://cdn.discordapp.com/avatars/${response.id}/${response.avatar}.png?size=64`
        // $('.discord-tag').innerHTML = `<b>${response.username}</b>#${response.discriminator}`
        // Get userID
        userID = response.id
    }

    // Update shop
    updateShop()

    document.getElementById('search-bar').addEventListener('input', e => {
        textFilter = e.target.value
        updateData()
    })

    document.querySelectorAll('#dropdown-sortby .dropdown-item').forEach(el => {
        el.addEventListener('click', e => {
            // Change is-active
            let active = $('#dropdown-sortby .dropdown-item.is-active')
            if(active) active.classList.remove('is-active')
            e.target.classList.add('is-active')
            // Update filter
            sortBy = e.target.innerText
            sortBy = sortBy.replace(/\ /g, '').toLowerCase()
            updateData()
        })
    })

    document.querySelectorAll('#dropdown-sortorder .dropdown-item').forEach(el => {
        el.addEventListener('click', e => {
            // Change is-active
            let active = $('#dropdown-sortorder .dropdown-item.is-active')
            if(active) active.classList.remove('is-active')
            e.target.classList.add('is-active')
            // Update filter
            sortOrder = e.target.innerText
            sortOrder = sortOrder.replace(/\ /g, '').toLowerCase()
            updateData()
        })
    })

    document.querySelectorAll('.modal-background, .modal button.delete, .modal .cancel-button, .modal .ok-button').forEach(el => {
        el.addEventListener('click', ev => {
            closeModals()
        })
    })
})

const closeModals = () => {
    document.querySelectorAll('.modal').forEach(e => {
        e.classList.remove('is-active')
    })
}