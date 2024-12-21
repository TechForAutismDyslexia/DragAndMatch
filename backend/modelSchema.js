const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dragandmatchSchema = new Schema({
  questionset: [
    {
      question: [
        {
          type: String,
          required: true,
        },
      ],
    },
  ],
  setNo: {
    type: Number,
    required: true,
  },
});
module.exports =
  mongoose.models.dragandmatchSchema ||
  mongoose.model("dragandmatch", dragandmatchSchema);
