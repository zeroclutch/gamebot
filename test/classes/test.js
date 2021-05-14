import colors from 'colors'
colors.enable()

let tests = 0,
    successfulTests = 0,
    moment = Date.now()

const test = async (name, f) => {
    tests++
    console.log(`${tests}) ${'Running test suite '.yellow}"${name.blue}"\n`.underline)
    await f()
    .then(() => {
        console.log(`Test suite "`.green + name.blue + `" completed successfully.\n\n`.green)
        successfulTests++
    })
    .catch((error) => {
        console.error(`Test suite "`.red + name.blue + `" stopped with error:`.red)
        console.error(error.toString().red)
        console.error('\n\n')
        process.exitCode = 1
    })
}

const testSync = (name, f) => {
    tests++
    console.log(`${tests}) Running test suite "${name}"`)
    try {
        f()
        successfulTests++
    } catch (error) {
        console.error(`Test suite "${name}" with error:`)
        console.error(error)
        process.exitCode = 1
    }
}

const testResults = () =>
    console.log('Passed '.yellow.underline + successfulTests.toString().green.underline + '/'.yellow.underline + tests.toString().blue.underline + ` tests in ${(Date.now() - moment)/1000} seconds.\n\n`.yellow.underline)

export {
    test,
    testSync,
    testResults,
}