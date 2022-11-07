export const resolve = (ms, opts={relative: true}) => {
    let optString = ''
    if(opts.relative) optString += 'R'
    `<t:${Math.round(ms / 1000)}:${optString}>`
}