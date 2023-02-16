export interface MediaCheckProps {
  type: string;
  label: string;
  index: number;
  media: string;
}

const MediaCheck = ({ type, index, media, label }: MediaCheckProps) => {
  return (
    <>
      {type !== "text" && (
        <>
          {media && type === "image" && (
            <div>
              <label htmlFor="step" className="font-bold text-gray-600">
                Current {label} Image
              </label>
              <img className="h-32 w-32 object-cover" src={media} />
            </div>
          )}
          {media && type === "video" && (
            <div>
              <label htmlFor="step" className="font-bold text-gray-600">
                Current {label} Video
              </label>
              <video src={media} controls />
            </div>
          )}
          {media && type === "sound" && (
            <div>
              <label htmlFor="step" className="font-bold text-gray-600">
                Current {label} Audio
              </label>
              <audio src={media} controls />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default MediaCheck;
