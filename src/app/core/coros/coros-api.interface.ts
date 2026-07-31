/** One Coros activity, reduced to what matching a race needs. */
export interface CorosActivity {
  labelId: string;
  /** Local calendar day of the activity, ISO — Coros itself reports it as a `YYYYMMDD` number. */
  dateIso: string;
  distanceM: number;
  totalTimeS: number;
  sportType: number;
  name: string;
}

/** The envelope every Training Hub endpoint answers with. */
export interface CorosResponse<T> {
  result?: string;
  message?: string;
  data?: T;
}

export interface CorosLoginData {
  accessToken?: string;
}

export interface CorosActivityRow {
  labelId?: string;
  date?: number;
  distance?: number;
  totalTime?: number;
  sportType?: number;
  name?: string;
}

export interface CorosQueryData {
  count?: number;
  totalPage?: number;
  dataList?: CorosActivityRow[];
}

export interface CorosDownloadData {
  /** Unsigned CDN link — anyone holding it can fetch the file, so it is never stored or logged. */
  fileUrl?: string;
}
