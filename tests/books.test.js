// Integration Test for Books route

process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async() => {
    let result = await db.query(`
    INSERT INTO
        books (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
            '999999999',
            'https://amazon.com/ninenines',
            'Henry',
            'English',
            99,
            'No publisher',
            'nine nines', 2009)
        RETURNING isbn`);
    book_isbn = result.rows[0].isbn
});

describe("POST /books", function () {
    test("create new book", async function () {
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn: '123456789',
                amazon_url: "https://numbers.com",
                author: "test",
                language: "english",
                pages: 100,
                published: "none",
                title: "numbers",
                year: 2010
            });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
    });

    test("prevent create new book without title", async function () {
        const response = await request(app)
            .post(`/books`)
            .send({year: 2010});
        expect(response.statusCode).toBe(400);
    })
})

describe("GET /books", function () {
    test("gets a list of books", async function () {
        const response = await request(app).get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", function () {
    test("gets a single book", async function () {
        const response = await request(app).get(`/books/${book_isbn}`)
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("respond with 404 if book not found", async function () {
        const response = await request(app).get(`/books/9999`)
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:id", function () {
    test("updates a single book", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: "https://numbers.com",
                author: "test",
                language: "english",
                pages: 100,
                published: "none",
                title: "updated numbers",
                year: 2010
            });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("updated numbers");
    });

    test("prevents bad update", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: "111111111",
                badField: "do not add",
                amazon_url: "https://numbers.com",
                author: "test",
                language: "english",
                pages: 100,
                published: "none",
                title: "updated numbers",
                year: 2010
            });
        expect(response.statusCode).toBe(400);
    });

    test("responds with 404 if book not found", async function () {
        const response = await request(app)
            .put(`/books/999`)
            .send({
                amazon_url: "https://numbers.com",
                author: "test",
                language: "english",
                pages: 100,
                published: "none",
                title: "updated numbers",
                year: 2010
            });
        expect(response.statusCode).toBe(404);
    })
});

describe("DELETE /books/:id", function () {
    test("deletes a single book", async function () {
        const response = await request(app)
            .delete(`/books/${book_isbn}`)
        expect(response.body).toEqual({message: "Book deleted"});
    });

    test("responds with 404 if book not found", async function () {
        // delete book then request
        await request(app)
            .delete(`/books/${book_isbn}`)
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(404);
    });
})

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
    await db.end()
});