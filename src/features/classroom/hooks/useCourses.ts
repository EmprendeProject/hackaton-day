import { useState, useEffect } from "react";
import { Course } from "../../../types";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return { courses, isLoading };
}
