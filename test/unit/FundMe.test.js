const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
describe("FundMe", async function() {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")

    !developmentChains.includes(network.name)
        ? describe.skip
        : beforeEach(async function() {
              // eploy our fundMe contract
              // using Hardhat-deploy

              // const accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

    describe("constructor", function() {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", function() {
        // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
        // could also do assert.fail
        it("Fails if you don't send enough ETH", async function() {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("update the amount funded data structure", async function() {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Add funder to array of getFunder", async function() {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", function() {
        beforeEach(async function() {
            await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single funder", async function() {
            // Arange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalnce = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Gascost
            // Assert- Make sure gasCost calculate in the transaction
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalnce),
                endingDeployerBalance.add(gasCost).toString()
            )
            console.log("startingFundMeBalance", +startingFundMeBalance)
            console.log("startingDeployerBalnce", +startingDeployerBalnce)
            console.log("endingDeployerBalance", +endingDeployerBalance)
            console.log("Gas Cost", +gasCost)
        })

        it("Allows us to withdraw with multiple getFunder", async function() {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalnce = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalnce),
                endingDeployerBalance.add(gasCost).toString()
            )
            // Make a getter for stroage variables
            // await expect(fundMe.getFunder(0)).to.be.reverted

            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
        it("Only allows the owner to withdraw", async function() {
            const accounts = await ethers.getSigners()
            const fundMeConnectedContract = await fundMe.connect(accounts[1])

            await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
                "FundMe__NotOwner"
            )
        })

        it("Cheaper withdraw testing", async function() {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalnce = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalnce),
                endingDeployerBalance.add(gasCost).toString()
            )
            // Make a getter for stroage variables
            // await expect(fundMe.getFunder(0)).to.be.reverted

            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
        it("CheaperWithdraw ETH from a single funder", async function() {
            // Arange
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalnce = await fundMe.provider.getBalance(
                deployer
            )

            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Gascost
            // Assert- Make sure gasCost calculate in the transaction
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalnce),
                endingDeployerBalance.add(gasCost).toString()
            )
            console.log("startingFundMeBalance", +startingFundMeBalance)
            console.log("startingDeployerBalnce", +startingDeployerBalnce)
            console.log("endingDeployerBalance", +endingDeployerBalance)
            console.log("Gas Cost", +gasCost)
        })
    })
})
