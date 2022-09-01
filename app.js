// app.js
import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";

const __dirname = path.resolve();

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));

const port = 3002;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
//전체조회
app.get("/users", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by id desc`);
  res.json(users);
});
//이미지 조회
app.get("/getFiles", async (req, res) => {
  const [imgSrcs] = await pool.query(
    `
    SELECT * FROM img_table;
    `
  );
  res.json(imgSrcs);
});
//DB에 이미지 삽입
app.post("/upload", async (req, res) => {
  let uploadFile = req.files.img;
  const fileName = req.files.img.name;
  const name = Date.now() + "." + fileName;
  uploadFile.mv(`${__dirname}/public/files/${name}`, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const imgSrc = `http://localhost:3002/files/${name}`;
    await pool.query(
      `
      INSERT INTO img_table SET imgSrc = ?;
      `,
      [imgSrc]
    );
    // insta 테이블의 imgSrc 항목에 넣으려면 id ,pw, phone 등필요.
    // 따로 이미지 테이블만 만든다고 가정하면 관리가 가능한가?
    // img_table의 id에 insta테이블의 userid를 넣으면 어떨까

    res.send("등록됨");
  });
});
//이름순조회
app.get("/usersName", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by name desc`);
  res.json(users);
});
//이름역순조회
app.get("/usersNameReverse", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by name asc`);
  res.json(users);
});
//가입날짜순 조회
app.get("/usersRegdate", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by regDate desc`);
  res.json(users);
});
//가입날짜역순 조회
app.get("/usersRegdateReverse", async (req, res) => {
  const [users] = await pool.query(`SELECT * FROM users order by regDate asc`);
  res.json(users);
});

//유저로그인
app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  const [[user]] = await pool.query(
    `
  SELECT * 
  from \`user\` 
  where userid = ?
  `,
    [user_id]
  );

  if (!user) {
    res.status(401).json({
      authenticated: false,
      msg: "일치하는 회원이 없습니다.",
    });
    return;
  }
  if (user.password != password) {
    res.status(401).json({
      authenticated: false,
      msg: "비밀번호가 일치하지 않습니다.",
    });
    return;
  } else {
    res.status(200).json({
      authenticated: true,
      msg: "로그인 되었습니다.",
      user: user,
    });
  }
});

//단건조회
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const [userRow] = await pool.query(
    `
    SELECT * FROM users where id = ?
    `,
    [id]
  );

  if (userRow.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json([userRow]);
});
//전체수정
app.patch("/users/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, feature } = req.body;

  const [userRow] = await pool.query(
    `
  select * from users where id = ?`,
    [id]
  );

  if (userRow.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  if (!name || !address || !phone || !feature) {
    res.status(400).json({
      msg: "name, address, phone, feature required",
    });
  }
  const [rs] = await pool.query(
    `
  update users set
  name = ?,
  address = ?,
  phone = ?,
  regDate = now(),
  feature = ?
  where id = ?
  `,
    [name, address, phone, feature, id]
  );

  const [updateUsers] = await pool.query(
    `
    select * from users order by id desc
    `
  );
  res.json(updateUsers);
});
//유저 한명 삭제
app.delete("/users/delete/:id", async (req, res) => {
  const { id } = req.params;

  const [user] = await pool.query(
    `
  select * from users where id = ?`,
    [id]
  );

  if (user === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `
  delete from users where id = ?`,
    [id]
  );

  res.json({
    msg: `${id}번 유저가 삭제되었습니다.`,
  });
});
//유저 생성
app.post("/users/add", async (req, res) => {
  const { name, address, phone, feature } = req.body;

  if (!name || !address || !phone || !feature) {
    res.status(400).json({
      msg: "contents required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    INSERT INTO users SET regDate = NOW(),
    NAME = ?, 
    address = ?, 
    phone = ?, 
    feature = ?
    `,
    [name, address, phone, feature]
  );

  const [updatedUsers] = await pool.query(
    `select * from users order by id desc`
  );

  res.json(updatedUsers);
});
//유저 검색
app.get("/usersSearch/:name", async (req, res) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({
      msg: "name required",
    });
    return;
  }

  const [users] = await pool.query(`SELECT * FROM users where name = ?`, [
    name,
  ]);

  if (users.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(users);
});
//insta 유저 가입
app.post("/joinMember", async (req, res) => {
  const { username, phone, userid, password } = req.body;

  if (username == null) {
    res.status(400).json({
      msg: "username required",
    });
    return;
  }
  if (phone == null) {
    res.status(400).json({
      msg: "phone required",
    });
    return;
  }
  if (userid == null) {
    res.status(400).json({
      msg: "userid required",
    });
    return;
  }
  if (password == null) {
    res.status(400).json({
      msg: "password required",
    });
    return;
  }

  await pool.query(
    `
  insert into insta set username = ?,
  phone = ?,
  userid = ?,
  password = ?`,
    [username, phone, userid, password]
  );

  res.json({
    msg: "가입이 완료되었습니다.",
  });
});
//insta 유저 로그인
app.post("/loginMember", async (req, res) => {
  const { userid, password } = req.body;

  const [[user]] = await pool.query(
    `
  SELECT * 
  from insta 
  where userid = ?
  `,
    [userid]
  );

  if (!user) {
    res.status(401).json({
      authenticated: false,
      msg: "일치하는 회원이 없습니다.",
    });
    return;
  }
  if (user.password != password) {
    res.status(401).json({
      authenticated: false,
      msg: "비밀번호가 일치하지 않습니다.",
    });
    return;
  } else {
    res.status(200).json({
      authenticated: true,
      msg: "로그인 되었습니다.",
      user: user,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
