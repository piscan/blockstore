const Web3 = require("pweb3");
const MongoClient = require('mongodb').MongoClient;

class BlockStore {

    constructor(dbName = 'piscan', blockToRead = 1000, blockColl = 'blocks', transactionColl = 'transactions', blockIncludesTransactions = 'blocksWithTransactions') {

        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:6969/pchain"));
        this.url = "mongodb://localhost:27017";
        this.dbName = dbName;
        this.blockCollection = blockColl;
        this.transactionsCollection = transactionColl;
        this.blockWithTransactions = blockIncludesTransactions;
        this.theNumberOfBlockToRead = blockToRead;

    }

    //region  init and close DB

    async initDb() {

        this.client = await MongoClient.connect(this.url, {useNewUrlParser: true}).catch(error =>
            console.log("error ", error));

        try {

            this.db = await this.client.db(this.dbName);

        } catch (e) {

            throw  new Error(e);


        }

    }

    async closeDb() {

        if (this.client) {
            await this.client.close();

        }
    }

    //endregion


    //region  block

    async getLastNumber(coll) {

        try {


            const collection = await this.db.collection(coll);

            const res = await collection.find().limit(1).sort({$natural: -1}).toArray();


            if (res.length === 0) {

                return 0;

            } else {

                return (res[0].number + 1);

            }

        } catch (e) {

            throw new Error(e)

        }


    }

    async saveInDatabase(data, coll) {


        if (data.length !== 0) {
            const collection = await this.db.collection(coll);

            const inserted = await collection.insertMany(data);

            console.log(`inserted in ${coll} : ${inserted.insertedCount}`);

        }

    }

    async getBlockInfo() {

        const sortedData = [];
        const includeTransactionsBlock = [];


        let last = await this.getLastNumber(this.blockCollection);

        console.log("the last block number is :  ", last);


        for (let i = last; i < (last + this.theNumberOfBlockToRead); i++) {


            const x = this.web3.pi.getBlock(i, async (e, r) => {

                if (e) throw  e;

                await sortedData.push(r);


            });

        }


        setTimeout(async () => {

            sortedData.sort((a, b) => {
                return (a.number - b.number)
            });


            for (let i = 0; i < sortedData.length; i++) {

                if (sortedData[i].transactions.length !== 0) {
                    await includeTransactionsBlock.push(sortedData[i]);

                }

            }


            await this.saveInDatabase(sortedData, this.blockCollection).catch(e => console.log(e));
            await this.saveInDatabase(includeTransactionsBlock, this.blockWithTransactions).catch(e => console.log(e));


        }, 500)

    }

    //endregion

    async isOkData() {

        let blockNumber = [];

        const collection = await this.db.collection(this.blockCollection);


        for (let i = 0; i <= 159000; i++) {


            const index1 = await collection.find({number: i}).toArray();

            //console.log(i )  ;

            if (index1[0].number === "undefined") {
                console.log(i);
                return;

            }
            await blockNumber.push(index1[0].number);

        }


        for (let i = 0; i <= blockNumber.length; i++) {
            if ((blockNumber[i] - blockNumber[i - 1]) > 1) {

                console.log("block number breaking :", blockNumber);
                break;

            }
        }

        console.log("finished ");

    }


}


module.exports = {BlockStore};










