const express = require("express");
const router = express.Router();
const dragandmatch = require("../models/dragandmatchSchema");
router.get("/:setNo", async (req, res) => {
  console.log("dragandmatch");
  try {
    const questions = await dragandmatch.findOne({ setNo: req.params.setNo });
    console.log(questions);
    if (!questions) {
      return res
        .status(404)
        .json({ message: "No game data found for the given setNo" });
    }
    const transformedQuestions = questions.questionset.map((q) => ({
      question: q.question,
    }));
    console.log(transformedQuestions);
    res.json(transformedQuestions);
  } catch (error) {
    console.error(error);
    res.json({ message: "Server error" });
  }
});
module.exports = router;
