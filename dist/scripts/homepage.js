(() => {
window.addEventListener('scroll', () => {
    Array.from(document.getElementsByClassName('parallax')).forEach(el => {
        let modifier = Math.floor(-window.scrollY / 3) + 'px'
        el.style.transform = `translateY(${modifier})`
    })
})

const getCookie = name => {
    let row = document.cookie.split('; ').find(row => row.startsWith(name))

    if (row) {
        return row.split('=')[1]
    } else {
        return false
    }
}

let developerStatus = getCookie('developer-status')
if(developerStatus) {
    gtag = (...args) => { console.log(args) };
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/guilds').then(response => response.json()).then(data => {
        document.getElementById('servers').innerText = data.guilds
        document.getElementById('shards').innerText = data.shards
    })
})
})()