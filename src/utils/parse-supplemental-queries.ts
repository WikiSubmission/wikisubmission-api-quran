export function parseSupplementalQueries<T extends Record<string, any>>(raw: any): T {
    const parsed: Record<string, any> = {};
  
    for (const key in raw) {
      const value = raw[key];
  
      if (value === "true") {
        parsed[key] = true;
      } else if (value === "false") {
        parsed[key] = false;
      } else if (!isNaN(Number(value)) && value.trim() !== "") {
        parsed[key] = Number(value);
      } else {
        parsed[key] = value;
      }
    }
  
    return parsed as T;
  }