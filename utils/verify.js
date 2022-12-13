const { getContractAddress } = require("ethers/lib/utils")
const { run } = require("hardhat")

const verify = async (getContractAddress, args) => {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: getContractAddress,
            constructorArguments: args
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(error)
        }
    }
}

module.exports = { verify }
