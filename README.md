# Readr

![react](https://img.shields.io/badge/17.0.1-0?label=react.js&style=for-the-badge&labelColor=white&color=black) ![apollo client](https://img.shields.io/badge/3.5.8-0?label=@apollo/client&style=for-the-badge&labelColor=white&color=black) ![apollo server express](https://img.shields.io/badge/3.10.0-0?label=@apollo%20server%20express&style=for-the-badge&labelColor=white&color=black) ![graphql](https://img.shields.io/badge/15.4.0-0?label=graphql&style=for-the-badge&labelColor=white&color=black)

## Introduction

This two-page web app displays a Google Book Search with React and Apollo client front-end and Apollo Server and Graph QL backend. The app allows users to login and save books to their reading list without refreshing the page.

On the front end, this Node application uses npm packages `@apollo/client`, `react` and `react-bootstrap`.

On the back end, this application uses npm packages `apollo-server-express`, `graphql`, `jsonwebtoken` and `mongoose`.

I made this app in order to learn how to implement Graph QL on the back end. In future I will learn how to add reducers and Stripe to my full- stack application.

## Usage

- The app is deployed at https://reader.herokuapp.com/
- The repo is at https://github.com/leoelicos/readr

## Development and Testing

### 0. Download Node

| Programs | Download links                  |
| -------- | ------------------------------- |
| `Node`   | https://nodejs.org/en/download/ |

### 1. Git clone and go inside

```sh
git clone https://github.com/leoelicos/readr.git

cd readr
```

### 2. Install dependencies

```sh
npm install
```

### 3. Run in browser

```sh
npm run develop
```

## Video Demo

https://user-images.githubusercontent.com/99461390/179760452-28799488-6f25-4413-b0e8-871274f0ebfd.mp4

Video is also available on [YouTube](https://www.youtube.com/watch?v=CYu8L-D1U0s)

## Screenshots

### Home Page:

![bse_homePage](https://user-images.githubusercontent.com/99461390/179761455-bdbd96ed-3a61-4acb-8cca-bc18c32f7950.jpg)

### Search Results:

![bse_searchResults](https://user-images.githubusercontent.com/99461390/179761467-660eb391-46ed-44ef-8628-d7322d93c82d.jpg)

### Login Modal:

![bse_loginModal](https://user-images.githubusercontent.com/99461390/179761476-5f5c5388-fecd-4b78-875e-3f525a36f0d1.jpg)

### Save Books:

![bse_saveBooks](https://user-images.githubusercontent.com/99461390/179761504-cc1ee9ab-df4e-4ea3-8eab-cde689d32094.jpg)

### Context Menu:

![bse_contextMenu](https://user-images.githubusercontent.com/99461390/179761516-c5206e84-421f-4fef-ac64-8cf115f8423c.jpg)

### Delete Option:

![bse_deleteOption](https://user-images.githubusercontent.com/99461390/179761530-6094b69b-60ce-4a2b-9254-df8c24e9668c.jpg)

## Credits

- BCS Resources

## License

&copy; Leo Wong <leoelicos@gmail.com>

Licensed under the [MIT License](./LICENSE).
