import { apiFetch, ApiErrors } from "./api-fetch.js";
import { getLesson } from "./lesson.js";
/**
 * Saves the user's reading progress in a lesson.
 *
 * @param {string|number} lessonId - The unique identifier of the lesson.
 * @param {number} sentenceIndex - Index of the sentence where the user stopped reading.
 * @param {boolean} completed - Whether the user finished the lesson.
 * @param {boolean} [keepalive=false] - Lets the request finish even if the page is being closed.
 * @returns {Promise<any>} A promise that resolves to the saved progress,
 * or an error value returned by the API client.
 */
export async function saveLessonProgress(lessonId, sentenceIndex, completed, keepalive = false) {

    const url = `https://languagedive.bryanrodriguez.tech/api/progress/lessons/${lessonId}`;

    const requestObject = {
        method: 'PUT',
        keepalive: keepalive,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'sentenceIndex': sentenceIndex,
            'completed': completed
        })
    };

    const progressResponse = await apiFetch(url, requestObject, true);

    return progressResponse;
}

/**
 * Calculates how much of a lesson the user has read.
 * The course detail only gives the saved sentence, so for lessons in progress the
 * lesson's total sentences is requested (with pageSize 1, to avoid downloading the text).
 * Uses the same formula as the lesson page so both show the same percentage.
 *
 * @param {string|number} courseId - The course the lesson belongs to.
 * @param {Object} lessonSummary - Lesson summary from the course detail.
 * @returns {Promise<number>} Whole number from 0 to 100 (0 if the total could not be loaded).
 */
export async function getLessonProgressPercentage(courseId, lessonSummary) {
    const progress = lessonSummary.progress;
    if (!progress) return 0;
    if (progress.completed) return 100;
    if (!progress.sentenceIndex) return 0;

    const lessonResponse = await getLesson(courseId, lessonSummary.id, 0, 1);
    if (Object.values(ApiErrors).includes(lessonResponse) || !lessonResponse.totalSentences) {
        console.error(lessonResponse);
        return 0;
    }
    return Math.min(100, Math.round((progress.sentenceIndex / lessonResponse.totalSentences) * 100));
}

/**
 * Real progress of a course, counting lessons read halfway.
 * The API's progressPercentage only counts completed lessons, so a course with a lesson
 * read halfway would show 0%. Here the overall progress is the average of its lessons.
 *
 * @param {Object} courseDetail - Response of getCourseById (with its lessons).
 * @returns {Promise<{ lessonPercentages: number[], percentage: number, isInProgress: boolean }>}
 * Progress of each lesson (in order), overall progress (0-100), and whether the user
 * started the course without finishing it.
 */
export async function getCourseProgress(courseDetail) {
    const lessons = courseDetail.lessons;
    // Los porcentajes se piden todos a la vez para no esperar lección por lección
    const lessonPercentages = await Promise.all(
        lessons.map(lesson => getLessonProgressPercentage(courseDetail.id, lesson))
    );

    const hasStarted = lessons.some(lesson => lesson.progress?.completed || lesson.progress?.sentenceIndex > 0);
    const isFinished = lessons.length > 0 && lessons.every(lesson => lesson.progress?.completed);

    let percentage = lessons.length
        ? Math.round(lessonPercentages.reduce((sum, value) => sum + value, 0) / lessons.length)
        : 0;
    // Un curso empezado no muestra 0% aunque lo leído sea muy poco
    if (hasStarted && percentage === 0) percentage = 1;

    return { lessonPercentages, percentage, isInProgress: hasStarted && !isFinished };
}
