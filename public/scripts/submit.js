/**
 * A global submission function that wraps all the content. 
 */
const submit = () => {
    switch (pageType) {
        case 'text': 
            submitText(document.querySelector('form.ui-form'))
            break;
        case 'drawing':
            submitImage(document.querySelector('#c').toDataURL())
            break;
    }
}

/**
 * Submit parsed data to the server. Don't call this method directly.
 * @param {Object} data JSON-stringifiable data.
 */
const submitData = (data) => {
    // Get ID from URL
    const UI_ID = document.URL.match(/(\/game\/)(\w+)/g).join('').replace('/game/','')
    fetch('/response/' + UI_ID, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Connection': 'close',
        },
        body: JSON.stringify(data),
    }).then(response => {
        window.location = response.url
    }).catch(console.error)
}

/**
 * Submit from a text webpage
 * @param {Element} form The form element
 */
const submitText = (form) => {
    submitData({
        value: document.querySelector('.ui-value').value
    })
}

const submitImage = (dataURL) => {
    let image = dataURL.replace(/^data:image\/\w+;base64,/, '')
    submitData({
        value: image
    })
}

// Start time is relative to the page load
let startTime = Date.now()

const updateTimer = () => {
    if(Date.now() >= killAt) {
        // Submit entered content
        submit()
    }

    const timer = document.querySelector('.timer')
    const timeRemaining = document.querySelector('.time-remaining')

    // Update bar width
    let percentage = Math.max(0, Math.floor((1 - (Date.now() - startTime) / (killAt - startTime)) * 100))
    timer.style.width = `${percentage}vw`

    // Create new text node
    let newTimeRemaining = document.createElement('span')
    newTimeRemaining.classList.add('time-remaining')
    newTimeRemaining.appendChild(document.createTextNode(`${Math.max(Math.floor((killAt - Date.now()) / 1000), 0)}`))

    // Update time in webpage
    timeRemaining.replaceWith(newTimeRemaining)

}

document.addEventListener('load', updateTimer)


setInterval(updateTimer, 1000)