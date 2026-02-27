export const getDateGroupStage = (groupBy, field) => {
  switch (groupBy) {
    case "day":
      return {
        $dateToString: { format: "%Y-%m-%d", date: field },
      };

    case "week":
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateTrunc: { date: field, unit: "week" },
          },
        },
      };

    case "month":
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateTrunc: { date: field, unit: "month" },
          },
        },
      };

    case "quarter":
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateTrunc: { date: field, unit: "quarter" },
          },
        },
      };

    case "year":
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateTrunc: { date: field, unit: "year" },
          },
        },
      };

    default:
      return {
        $dateToString: { format: "%Y-%m-%d", date: field },
      };
  }
};
