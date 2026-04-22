import { Injectable } from '@nestjs/common';
import {
  Question,
  Category,
  Difficulty,
} from '@wyr/shared';

const QUESTIONS: Question[] = [
  { id: 'q1', text: 'Would you rather always have to sing instead of speak, or always have to dance instead of walk?', options: [{ id: 'q1a', label: 'Sing instead of speak' }, { id: 'q1b', label: 'Dance instead of walk' }], category: 'silly', difficulty: 'easy' },
  { id: 'q2', text: 'Would you rather know when you\'re going to die or how you\'re going to die?', options: [{ id: 'q2a', label: 'Know when' }, { id: 'q2b', label: 'Know how' }], category: 'deep', difficulty: 'medium' },
  { id: 'q3', text: 'Would you rather have the ability to fly or be invisible?', options: [{ id: 'q3a', label: 'Fly' }, { id: 'q3b', label: 'Be invisible' }], category: 'classic', difficulty: 'easy' },
  { id: 'q4', text: 'Would you rather live in a world with no internet or no air conditioning/heating?', options: [{ id: 'q4a', label: 'No internet' }, { id: 'q4b', label: 'No AC/heating' }], category: 'hypothetical', difficulty: 'medium' },
  { id: 'q5', text: 'Would you rather save 5 strangers or 1 person you love?', options: [{ id: 'q5a', label: '5 strangers' }, { id: 'q5b', label: '1 loved one' }], category: 'moral', difficulty: 'hard' },
  { id: 'q6', text: 'Would you rather have a rewind button or a pause button for your life?', options: [{ id: 'q6a', label: 'Rewind button' }, { id: 'q6b', label: 'Pause button' }], category: 'deep', difficulty: 'medium' },
  { id: 'q7', text: 'Would you rather have to wear formal clothes every day or pajamas every day?', options: [{ id: 'q7a', label: 'Formal clothes' }, { id: 'q7b', label: 'Pajamas' }], category: 'silly', difficulty: 'easy' },
  { id: 'q8', text: 'Would you rather give up social media forever or give up watching movies/TV forever?', options: [{ id: 'q8a', label: 'Give up social media' }, { id: 'q8b', label: 'Give up movies/TV' }], category: 'classic', difficulty: 'easy' },
  { id: 'q9', text: 'Would you rather be able to talk to animals or speak every human language?', options: [{ id: 'q9a', label: 'Talk to animals' }, { id: 'q9b', label: 'Speak all languages' }], category: 'hypothetical', difficulty: 'easy' },
  { id: 'q10', text: 'Would you rather steal to feed your family or let them go hungry?', options: [{ id: 'q10a', label: 'Steal' }, { id: 'q10b', label: 'Let them go hungry' }], category: 'moral', difficulty: 'hard' },
  { id: 'q11', text: 'Would you rather have no taste buds or be color blind?', options: [{ id: 'q11a', label: 'No taste buds' }, { id: 'q11b', label: 'Color blind' }], category: 'classic', difficulty: 'easy' },
  { id: 'q12', text: 'Would you rather relive the same day forever or fast forward to the end of your life?', options: [{ id: 'q12a', label: 'Relive same day' }, { id: 'q12b', label: 'Fast forward' }], category: 'deep', difficulty: 'hard' },
  { id: 'q13', text: 'Would you rather your pet could talk but always lies or never talks but always understands you perfectly?', options: [{ id: 'q13a', label: 'Talks but lies' }, { id: 'q13b', label: 'Understands silently' }], category: 'silly', difficulty: 'medium' },
  { id: 'q14', text: 'Would you rather always know when someone is lying to you or always get away with lying?', options: [{ id: 'q14a', label: 'Detect lies' }, { id: 'q14b', label: 'Get away with lying' }], category: 'moral', difficulty: 'medium' },
  { id: 'q15', text: 'Would you rather live in space or under the ocean?', options: [{ id: 'q15a', label: 'In space' }, { id: 'q15b', label: 'Under the ocean' }], category: 'hypothetical', difficulty: 'easy' },
  { id: 'q16', text: 'Would you rather have your thoughts broadcast to everyone or never be able to speak again?', options: [{ id: 'q16a', label: 'Broadcast thoughts' }, { id: 'q16b', label: 'Never speak' }], category: 'deep', difficulty: 'hard' },
  { id: 'q17', text: 'Would you rather eat only pizza for a year or never eat pizza again?', options: [{ id: 'q17a', label: 'Only pizza for a year' }, { id: 'q17b', label: 'Never eat pizza again' }], category: 'silly', difficulty: 'easy' },
  { id: 'q18', text: 'Would you rather have the power to change one event in history or see one event in the future?', options: [{ id: 'q18a', label: 'Change the past' }, { id: 'q18b', label: 'See the future' }], category: 'hypothetical', difficulty: 'medium' },
  { id: 'q19', text: 'Would you rather betray a friend to save yourself or sacrifice yourself to save a friend?', options: [{ id: 'q19a', label: 'Betray a friend' }, { id: 'q19b', label: 'Sacrifice yourself' }], category: 'moral', difficulty: 'spicy' },
  { id: 'q20', text: 'Would you rather everyone forgets who you are or you forget who everyone is?', options: [{ id: 'q20a', label: 'Everyone forgets you' }, { id: 'q20b', label: 'You forget everyone' }], category: 'deep', difficulty: 'spicy' },
  { id: 'q21', text: 'Would you rather have a personal chef or a personal trainer for life?', options: [{ id: 'q21a', label: 'Personal chef' }, { id: 'q21b', label: 'Personal trainer' }], category: 'classic', difficulty: 'easy' },
  { id: 'q22', text: 'Would you rather always be 10 minutes late or 20 minutes early?', options: [{ id: 'q22a', label: 'Always 10 min late' }, { id: 'q22b', label: 'Always 20 min early' }], category: 'classic', difficulty: 'easy' },
  { id: 'q23', text: 'Would you rather have a photographic memory but no creativity or incredible creativity but terrible memory?', options: [{ id: 'q23a', label: 'Photographic memory' }, { id: 'q23b', label: 'Incredible creativity' }], category: 'deep', difficulty: 'medium' },
  { id: 'q24', text: 'Would you rather live in a world where everyone is brutally honest or everyone lies?', options: [{ id: 'q24a', label: 'Brutally honest' }, { id: 'q24b', label: 'Everyone lies' }], category: 'hypothetical', difficulty: 'hard' },
  { id: 'q25', text: 'Would you rather wear shoes made of LEGOs or socks that are always wet?', options: [{ id: 'q25a', label: 'LEGO shoes' }, { id: 'q25b', label: 'Wet socks' }], category: 'silly', difficulty: 'easy' },
  { id: 'q26', text: 'Would you rather know the truth about every conspiracy theory or have every conspiracy theorist know you believe them?', options: [{ id: 'q26a', label: 'Know all truths' }, { id: 'q26b', label: 'Be believed by all' }], category: 'silly', difficulty: 'medium' },
  { id: 'q27', text: 'Would you rather have the ability to read minds but never turn it off or never know what anyone is thinking?', options: [{ id: 'q27a', label: 'Read minds (always on)' }, { id: 'q27b', label: 'Never know thoughts' }], category: 'hypothetical', difficulty: 'hard' },
  { id: 'q28', text: 'Would you rather report a friend for a crime or help them cover it up?', options: [{ id: 'q28a', label: 'Report the friend' }, { id: 'q28b', label: 'Cover it up' }], category: 'moral', difficulty: 'spicy' },
  { id: 'q29', text: 'Would you rather only be able to whisper or only be able to shout?', options: [{ id: 'q29a', label: 'Only whisper' }, { id: 'q29b', label: 'Only shout' }], category: 'silly', difficulty: 'easy' },
  { id: 'q30', text: 'Would you rather time travel to the past or to the future?', options: [{ id: 'q30a', label: 'The past' }, { id: 'q30b', label: 'The future' }], category: 'classic', difficulty: 'easy' },
  { id: 'q31', text: 'Would you rather lose all your memories or never be able to make new ones?', options: [{ id: 'q31a', label: 'Lose all memories' }, { id: 'q31b', label: 'No new memories' }], category: 'deep', difficulty: 'spicy' },
  { id: 'q32', text: 'Would you rather have unlimited money but no friends or no money but amazing friends?', options: [{ id: 'q32a', label: 'Unlimited money' }, { id: 'q32b', label: 'Amazing friends' }], category: 'classic', difficulty: 'medium' },
  { id: 'q33', text: 'Would you rather have every traffic light turn green for you or never have to wait in a queue again?', options: [{ id: 'q33a', label: 'Green lights' }, { id: 'q33b', label: 'No queues' }], category: 'hypothetical', difficulty: 'easy' },
  { id: 'q34', text: 'Would you rather cheat on an exam to get your dream job or fail and work somewhere you hate?', options: [{ id: 'q34a', label: 'Cheat' }, { id: 'q34b', label: 'Fail honestly' }], category: 'moral', difficulty: 'hard' },
  { id: 'q35', text: 'Would you rather have a permanent clown face or a permanent clown laugh?', options: [{ id: 'q35a', label: 'Clown face' }, { id: 'q35b', label: 'Clown laugh' }], category: 'silly', difficulty: 'easy' },
  { id: 'q36', text: 'Would you rather live in a world without music or without movies?', options: [{ id: 'q36a', label: 'Without music' }, { id: 'q36b', label: 'Without movies' }], category: 'classic', difficulty: 'easy' },
  { id: 'q37', text: 'Would you rather know how the universe was created or what happens after death?', options: [{ id: 'q37a', label: 'Universe origin' }, { id: 'q37b', label: 'After death' }], category: 'deep', difficulty: 'hard' },
  { id: 'q38', text: 'Would you rather fight one horse-sized duck or a hundred duck-sized horses?', options: [{ id: 'q38a', label: 'One horse-sized duck' }, { id: 'q38b', label: '100 duck-sized horses' }], category: 'silly', difficulty: 'easy' },
  { id: 'q39', text: 'Would you rather live in a simulation you know about or in reality that you can never fully understand?', options: [{ id: 'q39a', label: 'Known simulation' }, { id: 'q39b', label: 'Mysterious reality' }], category: 'hypothetical', difficulty: 'spicy' },
  { id: 'q40', text: 'Would you rather lie to protect someone\'s feelings or tell the truth and hurt them?', options: [{ id: 'q40a', label: 'Lie to protect' }, { id: 'q40b', label: 'Truth that hurts' }], category: 'moral', difficulty: 'medium' },
  { id: 'q41', text: 'Would you rather have to skip everywhere or walk backwards everywhere?', options: [{ id: 'q41a', label: 'Skip everywhere' }, { id: 'q41b', label: 'Walk backwards' }], category: 'silly', difficulty: 'easy' },
  { id: 'q42', text: 'Would you rather be famous but misunderstood or unknown but happy?', options: [{ id: 'q42a', label: 'Famous but misunderstood' }, { id: 'q42b', label: 'Unknown but happy' }], category: 'deep', difficulty: 'medium' },
  { id: 'q43', text: 'Would you rather wake up in a new random country every morning or never leave your home country again?', options: [{ id: 'q43a', label: 'Random country daily' }, { id: 'q43b', label: 'Never leave' }], category: 'hypothetical', difficulty: 'medium' },
  { id: 'q44', text: 'Would you rather be the funniest person in the room or the smartest?', options: [{ id: 'q44a', label: 'Funniest' }, { id: 'q44b', label: 'Smartest' }], category: 'classic', difficulty: 'easy' },
  { id: 'q45', text: 'Would you rather give up cheese forever or give up chocolate forever?', options: [{ id: 'q45a', label: 'Give up cheese' }, { id: 'q45b', label: 'Give up chocolate' }], category: 'classic', difficulty: 'easy' },
  { id: 'q46', text: 'Would you rather have the power to undo one decision per year or see the outcome of every decision before making it?', options: [{ id: 'q46a', label: 'Undo one decision/year' }, { id: 'q46b', label: 'See outcomes first' }], category: 'hypothetical', difficulty: 'hard' },
  { id: 'q47', text: 'Would you rather accept a bribe to look the other way or refuse and lose your job?', options: [{ id: 'q47a', label: 'Accept the bribe' }, { id: 'q47b', label: 'Refuse and lose job' }], category: 'moral', difficulty: 'spicy' },
  { id: 'q48', text: 'Would you rather have a tail or horns?', options: [{ id: 'q48a', label: 'A tail' }, { id: 'q48b', label: 'Horns' }], category: 'silly', difficulty: 'easy' },
  { id: 'q49', text: 'Would you rather be able to control fire or water?', options: [{ id: 'q49a', label: 'Control fire' }, { id: 'q49b', label: 'Control water' }], category: 'classic', difficulty: 'easy' },
  { id: 'q50', text: 'Would you rather know every language ever spoken (including dead ones) or be able to play every musical instrument?', options: [{ id: 'q50a', label: 'Every language' }, { id: 'q50b', label: 'Every instrument' }], category: 'hypothetical', difficulty: 'easy' },
];

@Injectable()
export class QuestionBank {
  pickQuestions(
    count: number,
    categories: Category[],
    difficulties: Difficulty[],
    usedIds: Set<string>,
  ): Question[] {
    const catSet = new Set(categories);
    const difSet = new Set(difficulties);

    const available = QUESTIONS.filter(
      (q) =>
        catSet.has(q.category) &&
        difSet.has(q.difficulty) &&
        !usedIds.has(q.id),
    );

    // Shuffle (Fisher-Yates)
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    return available.slice(0, count);
  }
}
