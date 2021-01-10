(() => {
window.addEventListener('scroll', () => {
    Array.from(document.getElementsByClassName('parallax')).forEach(el => {
        let modifier = Math.floor(-window.scrollY / 3) + 'px'
        el.style.transform = `translateY(${modifier})`
    })
})

document.addEventListener('DOMContentLoaded', () => {
    fetch('/guilds').then(response => response.json()).then(data => {
        document.getElementById('servers').innerText = data.guilds
        document.getElementById('shards').innerText = data.shards
    })
})
})()