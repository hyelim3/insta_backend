import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { runInNewContext } from "vm";

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
  // password: "sbs123414",
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

//가입하기
app.post("/joinmember", async (req, res) => {
  const { userid, password, username, phone } = req.body;

  await pool.query(
    `
    INSERT INTO insta
    SET userid = ?,
    password = ?,
    username = ?,
    phone = ?
  `,
    [userid, password, username, phone]
  );

  res.json({ msg: "user가 생성되었습니다." });
});

app.post("/loginmember", async (req, res) => {
  const { userid, password } = req.body;

  const [[user]] = await pool.query(
    `
    select *
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
      authenticated: true, //인증값
      msg: "로그인이 되었습니다.",
      user: user,
    });
  }
});

//user 한명 조회
app.post("/getMember/:userid", async (req, res) => {
  const { userid } = req.params;

  const [[userRow]] = await pool.query(
    `
    select *
    from insta
    where userid = ?
    `,
    [userid]
  );
  if (!userid) {
    res.status(404).json({
      msg: "id가 필요하다.",
    });
    return;
  }

  if (!userRow) {
    res.status(400).json({
      msg: "일치하는 id가 없습니다.",
    });
    return;
  }

  res.json(userRow);
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

app.post("/getFiles/:userid", async (req, res) => {
  const { userid } = req.params;
  // console.log(userid);
  const [imgSrcs] = await pool.query(
    `
    SELECT * FROM img_table where userid = ?;
    `,
    [userid]
  );
  res.json(imgSrcs);
});

//DB에 이미지 삽입
app.post("/upload/:userid", async (req, res) => {
  const { userid } = req.params;
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
      INSERT INTO img_table SET imgSrc = ?,
      userid = ?
      `,
      [imgSrc, userid]
    );

    await pool.query(
      `
      update insta
      set article = article + 1
      where userid = ?
      `,
      [userid]
    );

    res.send(imgSrc); //주소를 받아서 바로 사용하기 위해, 리렌더링 등등
  });
});

//프사 변경
app.post("/profile/:userid", async (req, res) => {
  const { userid } = req.params;
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
      update insta
      SET imgSrc = ?
      where userid = ?
      `,
      [imgSrc, userid]
    );

    res.send(imgSrc); //주소를 받아서 바로 사용하기 위해, 리렌더링 등등
  });
});
app.delete("/delete", async (req, res) => {
  const { id, userid } = req.query;
  // console.log("id:", id);
  // console.log("userId:", userid);

  const [userRow] = await pool.query(
    `
    select *
    from img_table
    where id = ?
    `,
    [id]
  );
  // console.log("user", userRow);
  if (userRow == undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  await pool.query(
    `
    delete 
    from img_table
    where id = ?
    `,
    [id]
  );

  await pool.query(
    `
    update insta
    set article = article - 1
    where userid = ?
    `,
    [userid]
  );
  const [updatedUsers] = await pool.query(
    `
    select *
    from img_table
    order by id asc
    `,
    [id]
  );

  res.json(updatedUsers);
});

//팔로우 기능
app.get("/follow", async (req, res) => {
  const { reqId, resId } = req.query;
  // console.log(reqId);
  // console.log(resId);

  if (!reqId) {
    res.status(404).json({
      msg: "request id required",
    });
    return;
  }

  if (!resId) {
    res.status(404).json({
      msg: "resend id required",
    });
    return;
  }

  const [[follow]] = await pool.query(
    `
    select *
    from follow_table
    where followId = ?
    and followedId = ?
    `,
    [reqId, resId]
  );

  //true면 팔로우 중  팔로우 취소 -1
  //false면 팔로우 해야함 +1
  if (follow != undefined) {
    await pool.query(
      `
      update insta
      set follow = follow - 1
      where userid = ?
      `,
      [reqId]
    );
    await pool.query(
      `
      update insta
      set follower = follower - 1
      where userid = ?
      `,
      [resId]
    );
    res.json(false);

    await pool.query(
      `
      delete from follow_table
      where followId = ? and
      followedId = ?
      `,
      [reqId, resId]
    );
  } else if (follow == undefined) {
    await pool.query(
      `
      update insta
      set follow = follow + 1
      where userid = ?
      `,
      [reqId]
    );
    await pool.query(
      `
      update insta
      set follower = follower + 1
      where userid = ?
      `,
      [resId]
    );
    res.json(true);

    await pool.query(
      `
      insert into follow_table
      set followId = ?, 
      followedId = ?
      `,
      [reqId, resId]
    );
  }
});

//프로필 수정 업데이트
app.patch("/updateProfile/:userid", async (req, res) => {
  const { userid } = req.params;
  const { usename, introduce } = req.body;

  const [userRow] = await pool.query(
    `
    select *
    from insta
    where userid = ?
    `,
    [userid]
  );
  if (userRow == undefined) {
    res.status(404).json({
      msg: "not found",
    });
  }
  const [rs] = await pool.query(
    `
    update insta
    set usename = ?,
    introduce = ?
    where userid = ?
    `,
    [usename, introduce, userid]
  );
  const [[updatedUsers]] = await pool.query(
    `
    select *
    from insta
    where userid = ?
    `,
    [userid]
  );
  res.json(updatedUsers);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
