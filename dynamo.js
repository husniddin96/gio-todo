
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
class DynamoProvider {
    constructor() {
        this.client = new DynamoDBClient({
            region: 'eu-central-1'
        });
    }

    async saveItem(tableName, item) {
        const params = {
            TableName: tableName,
            Item: marshall(item, {
                removeUndefinedValues: true
            }),
        };

        try {
            await this.client.send(new PutItemCommand(params));
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getItem(tableName, key, value) {
        const params = {
            TableName: tableName,
            Key: marshall({ [key]: value }),
        };

        try {
            const result = await this.client.send(new GetItemCommand(params));
            if (!result || !result.Item) {
                return null;
            }

            return unmarshall(result.Item);
        } catch (error) {

        }
    }


    async getItems(tableName) {
        const params = {
            TableName: tableName,
        }

        try {
            const result = await this.client.send(new ScanCommand(params));
            if (!result || !result.Items || !result.Items.length) {
                return [];
            }
            return result.Items.map(item => unmarshall(item));
        } catch (error) {

        }
    }

    async deleteItem(tableName, key, value) {
        const params = {
            TableName: tableName,
            Key: {
                [key]: value
            },
        };

        try {
            const result = await this.client.send(new DeleteItemCommand(params));
            return true;
        } catch (error) {
            console.error({ error })
        }
    }

}

module.exports = new DynamoProvider();
