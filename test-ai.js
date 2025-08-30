// Simple test script to verify AI integration
const { generateSummary, generateQuiz, generateFlashcards } = require('./src/lib/ai.ts');

async function testAI() {
  console.log('🧪 Testing AI Integration...\n');
  
  const sampleText = `
    Artificial Intelligence (AI) is a branch of computer science that aims to create machines 
    capable of intelligent behavior. Machine learning is a subset of AI that focuses on 
    algorithms that can learn from data. Deep learning uses neural networks with multiple 
    layers to process complex patterns. Natural language processing enables computers to 
    understand and generate human language. Computer vision allows machines to interpret 
    visual information from the world.
  `;
  
  try {
    console.log('📝 Testing Summary Generation...');
    const summary = await generateSummary(sampleText);
    console.log('Summary:', summary.summary);
    console.log('Key Points:', summary.keyPoints);
    console.log('✅ Summary generation working!\n');
    
    console.log('❓ Testing Quiz Generation...');
    const quiz = await generateQuiz(sampleText, 3);
    console.log('Generated', quiz.length, 'questions');
    quiz.forEach((q, i) => {
      console.log(`Q${i+1}: ${q.question}`);
      console.log(`Options: ${q.options.join(', ')}`);
      console.log(`Correct: ${q.correctAnswer}\n`);
    });
    console.log('✅ Quiz generation working!\n');
    
    console.log('🃏 Testing Flashcard Generation...');
    const flashcards = await generateFlashcards(sampleText, 5);
    console.log('Generated', flashcards.length, 'flashcards');
    flashcards.forEach((card, i) => {
      console.log(`Card ${i+1}:`);
      console.log(`Front: ${card.front}`);
      console.log(`Back: ${card.back}\n`);
    });
    console.log('✅ Flashcard generation working!\n');
    
    console.log('🎉 All AI features are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing AI:', error);
  }
}

// Run the test
testAI();
