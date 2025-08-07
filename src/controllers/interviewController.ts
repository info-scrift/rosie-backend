import axios from 'axios';
import { Request, Response } from 'express';


const GROQ_API_KEY = process.env.GROQ_API_KEY;


export const generateQuestions = async (req: Request, res: Response) => {
  
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Resume text and job description are required'
      });
    }

    if (!resumeText.trim() || !jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Resume text and job description cannot be empty'
      });
    }

    const prompt = `You are an AI interviewer.Using the following resume and job description, generate exactly 5 interview questions that assess technical and behavioral fit(but easy short questions).Resume:${resumeText}Job Description:${jobDescription}Return only the 5 questions in a numbered list from 1 to 5. Do NOT include any introduction, explanation, or summary.Only output the numbered questions. No heading, no conclusion, no other text.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are an HR assistant helping evaluate candidates.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content ?? "";
    const extracted = content
      .split(/\n(?=\d+\.)/)
      .map((line:any) => line.trim())
      .filter(Boolean);

    res.json({
      success: true,
      questions: extracted
    });

  } catch (error:any) {
    console.error("❌ Error generating questions:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions. Please try again.',
      error: error.response?.data || error.message
    });
  }
};

    export const evaluateInterview = async (req: Request, res: Response) => {

  try {
    const { questions, answers } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({
        success: false,
        message: 'Questions and answers are required'
      });
    }

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Questions and answers must be arrays'
      });
    }

    const QnA = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");
    
    const prompt = `Evaluate this candidate based on their answers to the interview questions below. Hey if there are few grammatical mistakes ignore them and assume the correct words yourself and also keep a light hand Provide only:1. A score out of 100 2. A brief summary of their overall performance.${QnA}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are an expert interviewer.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const evaluation = response.data.choices[0]?.message?.content;

    res.json({
      success: true,
      evaluation: evaluation
    });

  } catch (error:any) {
    console.error("❌ Evaluation Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate interview. Please try again.',
      error: error.response?.data || error.message
    });
  }
};

