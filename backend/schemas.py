from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    role: str


class SessionCreate(BaseModel):
    topic: str
    mentor_name: str
    batch_name: str
    session_date: str
    session_time: str
    status: str


class MentorCreate(BaseModel):
    name: str
    email: str
    phone: str
    expertise: str
    linkedin: str
    hourly_rate: str


class BatchCreate(BaseModel):
    batch_name: str
    course_name: str
    strength: int
    mentor_name: str


class InvoiceCreate(BaseModel):
    mentor_name: str
    mentor_email: str | None = None
    batch_name: str
    month: str
    total_sessions: int
    total_hours: str
    hourly_rate: str
    total_amount: str
    payment_status: str
    invoice_number: str | None = None


class SessionAnalyticsCreate(BaseModel):
    session_id: int
    mentor_name: str
    batch_name: str
    scheduled_duration: float
    actual_duration: float
    mentor_join_time: str
    mentor_leave_time: str
    first_student_join: str
    last_student_leave: str
    registered_count: int
    joined_count: int
    unique_attendance: int
    duplicate_joins: int
    attendance_percentage: float
    late_joiners: int
    early_leavers: int
    poll_count: int
    poll_participants: int
    quiz_count: int
    quiz_participants: int
    average_quiz_score: float
    chat_messages: int
    private_messages: int
    public_messages: int
    questions_asked: int
    questions_answered: int
    recording_available: str
    recording_duration: float


class NPSCreate(BaseModel):
    learner_name: str
    learner_email: str
    mobile_number: str

    course_name: str
    batch_name: str
    mentor_name: str

    instructor_rating: int
    doubt_rating: int
    website_rating: int

    nps_score: int

    feedback: str


# ==========================================================
# Session Reports
# ==========================================================

class SessionReportUpdate(BaseModel):
    agenda: Optional[str] = None
    learning_objectives: Optional[str] = None
    topics_covered: Optional[str] = None
    lms_content_link: Optional[str] = None
    presentation_link: Optional[str] = None
    assignment_link: Optional[str] = None

    summary: Optional[str] = None
    learner_questions: Optional[str] = None
    discussion_points: Optional[str] = None
    issues_faced: Optional[str] = None
    technical_issues: Optional[str] = None
    learner_engagement: Optional[str] = None
    mentor_feedback: Optional[str] = None
    operations_notes: Optional[str] = None
    action_items: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None


class ReportStatusUpdate(BaseModel):
    report_status: str
    reviewed_by: Optional[str] = None


class SessionAttendanceCreate(BaseModel):
    learner_name: str
    learner_email: Optional[str] = None
    join_time: Optional[str] = None
    leave_time: Optional[str] = None
    duration_minutes: Optional[float] = None
    attendance_status: Optional[str] = "Present"


class SessionAttendanceUpdate(BaseModel):
    learner_name: Optional[str] = None
    learner_email: Optional[str] = None
    join_time: Optional[str] = None
    leave_time: Optional[str] = None
    duration_minutes: Optional[float] = None
    attendance_status: Optional[str] = None