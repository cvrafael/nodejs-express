const { request, response } = require('express');
const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();

//Sempre usar essa funcao para metodos "POST"
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((customers) => customers.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: "Customer not found" });
    }

    request.customer = customer;

    return next();

}

function getBalance(statement) {
    //transforma as informacoes colocadas dentro da funcao em somente um valor
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}
/* 
cpf - string
name - string
id - uuid
statement []
*/

//Com essa funcao podemos usar o middleware em todos os metodos que estiver abaixo
//app.use(verifyIfExistsAccountCPF);

//sempre que queremos buscar algum dado utilizamos metodo "GET"

app.post("/account", (request, response) => {
    const { cpf, name } = request.body;
    //some = busca / verificar se exist cpf na array
    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf);

    if (customersAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    return response.status(201).send();
});

app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        create_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds!" });
    }

    const statementOperation = {
        amount,
        create_at: new Date(),
        type: "debit",
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) =>
            statement.create_at.toDateString() ===
            new Date(dateFormat).toDateString()

    );

    return response.json(customer.statement);
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    //splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
})
//localhost:3000
app.listen(3000);