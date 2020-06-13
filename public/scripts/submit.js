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