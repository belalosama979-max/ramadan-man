/**
 * Winner Calculation Utility
 * 
 * Logic:
 * 1. Filter submissions for the specific question.
 * 2. Filter only correct answers.
 * 3. Sort by timestamp (ascending) - Earliest correct answer wins.
 * 4. Return the top result.
 */

export const calculateWinner = (submissions) => {
    if (!submissions || submissions.length === 0) return null;

    // 1. Filter correct answers
    const correctSubmissions = submissions.filter(s => s.isCorrect);

    if (correctSubmissions.length === 0) return null;

    // 2. Sort by responseTimeSeconds -> submittedAt -> id
    correctSubmissions.sort((a, b) => {
        const timeA = a.responseTimeSeconds ?? Infinity;
        const timeB = b.responseTimeSeconds ?? Infinity;
        
        if (timeA !== timeB) {
            return timeA - timeB;
        }

        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        
        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return a.id.localeCompare(b.id);
    });

    // 3. Return the winner
    return correctSubmissions[0];
};

export const calculateTop3Winners = (submissions) => {
    if (!submissions || submissions.length === 0) return null;

    // 1. Filter correct and with response time
    const correctSubmissions = submissions.filter(s => s.isCorrect && s.responseTimeSeconds != null);

    if (correctSubmissions.length === 0) return null;

    // 2. Sort strictly
    correctSubmissions.sort((a, b) => {
        const timeA = a.responseTimeSeconds;
        const timeB = b.responseTimeSeconds;
        if (timeA !== timeB) {
            return timeA - timeB; // Ascending primary
        }
        
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        if (dateA !== dateB) {
            return dateA - dateB; // Ascending secondary
        }

        return a.id.localeCompare(b.id); // Ascending fallback
    });

    // 3. Select first 3
    const top3 = correctSubmissions.slice(0, 3);
    
    // 4. Map format
    const topWinners = {};
    if (top3[0]) topWinners.first = { name: top3[0].name, responseTimeSeconds: top3[0].responseTimeSeconds, id: top3[0].id, submittedAt: top3[0].submittedAt };
    if (top3[1]) topWinners.second = { name: top3[1].name, responseTimeSeconds: top3[1].responseTimeSeconds, id: top3[1].id, submittedAt: top3[1].submittedAt };
    if (top3[2]) topWinners.third = { name: top3[2].name, responseTimeSeconds: top3[2].responseTimeSeconds, id: top3[2].id, submittedAt: top3[2].submittedAt };

    return topWinners;
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ar-SA');
};
