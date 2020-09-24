(() => {
window.addEventListener('scroll', () => {
    Array.from(document.getElementsByClassName('parallax')).forEach(el => {
        let modifier = Math.floor(-window.scrollY / 5) + 'px'
        el.style.marginTop = modifier
    })
})

mixpanel.track("Page view", {"page": "home"})

fetch('/guilds').then(response => response.json()).then(data => {
    document.getElementById('servers').innerText = data.guilds
    document.getElementById('shards').innerText = data.shards
})
})()