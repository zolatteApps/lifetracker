const moment = require('moment');

/**
 * Generate schedule block instances based on recurrence rule
 * @param {Object} baseBlock - The base schedule block with recurrence rule
 * @param {Date} startDate - Start date for generation
 * @param {Date} endDate - End date for generation (max range)
 * @returns {Array} Array of schedule block instances
 */
function generateRecurringInstances(baseBlock, startDate, endDate) {
  const instances = [];
  const { recurrenceRule } = baseBlock;
  
  if (!recurrenceRule || !recurrenceRule.type) {
    return instances;
  }
  
  const currentDate = moment(startDate).startOf('day');
  const maxDate = moment(endDate).endOf('day');
  const ruleEndDate = recurrenceRule.endDate ? moment(recurrenceRule.endDate) : null;
  const interval = recurrenceRule.interval || 1;
  let occurrenceCount = 0;
  
  // Set the actual end date based on rule
  const actualEndDate = ruleEndDate && ruleEndDate.isBefore(maxDate) ? ruleEndDate : maxDate;
  
  while (currentDate.isSameOrBefore(actualEndDate)) {
    let shouldAddInstance = false;
    
    switch (recurrenceRule.type) {
      case 'daily':
        shouldAddInstance = true;
        break;
        
      case 'weekly':
        if (recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
          const dayOfWeek = currentDate.day();
          shouldAddInstance = recurrenceRule.daysOfWeek.includes(dayOfWeek);
        } else {
          // If no specific days selected, use the original day
          const originalDay = moment(baseBlock.originalDate || startDate).day();
          shouldAddInstance = currentDate.day() === originalDay;
        }
        break;
        
      case 'monthly':
        const originalDayOfMonth = moment(baseBlock.originalDate || startDate).date();
        shouldAddInstance = currentDate.date() === originalDayOfMonth;
        break;
    }
    
    // Check if this date is in exceptions
    if (shouldAddInstance && recurrenceRule.exceptions && recurrenceRule.exceptions.length > 0) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const isException = recurrenceRule.exceptions.some(exDate => 
        moment(exDate).format('YYYY-MM-DD') === dateStr
      );
      if (isException) {
        shouldAddInstance = false;
      }
    }
    
    // Check interval
    if (shouldAddInstance && interval > 1) {
      const daysSinceStart = currentDate.diff(moment(startDate), 'days');
      
      switch (recurrenceRule.type) {
        case 'daily':
          shouldAddInstance = daysSinceStart % interval === 0;
          break;
        case 'weekly':
          const weeksSinceStart = Math.floor(daysSinceStart / 7);
          shouldAddInstance = shouldAddInstance && (weeksSinceStart % interval === 0);
          break;
        case 'monthly':
          const monthsSinceStart = currentDate.diff(moment(startDate), 'months');
          shouldAddInstance = monthsSinceStart % interval === 0;
          break;
      }
    }
    
    if (shouldAddInstance) {
      occurrenceCount++;
      
      // Check occurrence limit
      if (recurrenceRule.endOccurrences && occurrenceCount > recurrenceRule.endOccurrences) {
        break;
      }
      
      // Create instance for this date
      const instance = {
        ...baseBlock,
        id: `${baseBlock.id}-${currentDate.format('YYYY-MM-DD')}`,
        originalDate: currentDate.toDate(),
        completed: false, // New instances start as not completed
      };
      
      // Remove the recurrence rule from individual instances
      delete instance.recurrenceRule;
      
      instances.push({
        date: currentDate.format('YYYY-MM-DD'),
        block: instance
      });
    }
    
    // Move to next day
    currentDate.add(1, 'day');
  }
  
  return instances;
}

/**
 * Apply recurring tasks to multiple dates
 * @param {Object} recurringBlock - The block with recurrence rule
 * @param {String} startDateStr - Start date in YYYY-MM-DD format
 * @param {Number} daysAhead - Number of days to generate ahead
 * @returns {Array} Array of {date, blocks} objects
 */
function applyRecurringTaskToSchedules(recurringBlock, startDateStr, daysAhead = 30) {
  const startDate = moment(startDateStr);
  const endDate = moment(startDateStr).add(daysAhead, 'days');
  
  const instances = generateRecurringInstances(recurringBlock, startDate.toDate(), endDate.toDate());
  
  // Group instances by date
  const schedulesByDate = {};
  
  instances.forEach(({ date, block }) => {
    if (!schedulesByDate[date]) {
      schedulesByDate[date] = [];
    }
    schedulesByDate[date].push(block);
  });
  
  return Object.entries(schedulesByDate).map(([date, blocks]) => ({
    date,
    blocks
  }));
}

/**
 * Check if a date matches the recurrence rule
 * @param {Object} recurrenceRule - The recurrence rule
 * @param {Date} checkDate - Date to check
 * @param {Date} originalDate - Original date of the recurring task
 * @returns {Boolean} Whether the date matches the rule
 */
function isDateInRecurrence(recurrenceRule, checkDate, originalDate) {
  if (!recurrenceRule || !recurrenceRule.type) {
    return false;
  }
  
  const check = moment(checkDate);
  const original = moment(originalDate);
  
  // Check if date is before original date
  if (check.isBefore(original, 'day')) {
    return false;
  }
  
  // Check end date
  if (recurrenceRule.endDate && check.isAfter(moment(recurrenceRule.endDate), 'day')) {
    return false;
  }
  
  // Check exceptions
  if (recurrenceRule.exceptions && recurrenceRule.exceptions.length > 0) {
    const dateStr = check.format('YYYY-MM-DD');
    const isException = recurrenceRule.exceptions.some(exDate => 
      moment(exDate).format('YYYY-MM-DD') === dateStr
    );
    if (isException) {
      return false;
    }
  }
  
  const interval = recurrenceRule.interval || 1;
  
  switch (recurrenceRule.type) {
    case 'daily':
      const daysDiff = check.diff(original, 'days');
      return daysDiff >= 0 && daysDiff % interval === 0;
      
    case 'weekly':
      const weeksDiff = check.diff(original, 'weeks');
      if (weeksDiff < 0 || weeksDiff % interval !== 0) {
        return false;
      }
      
      if (recurrenceRule.daysOfWeek && recurrenceRule.daysOfWeek.length > 0) {
        return recurrenceRule.daysOfWeek.includes(check.day());
      }
      return check.day() === original.day();
      
    case 'monthly':
      const monthsDiff = check.diff(original, 'months');
      if (monthsDiff < 0 || monthsDiff % interval !== 0) {
        return false;
      }
      return check.date() === original.date();
      
    default:
      return false;
  }
}

module.exports = {
  generateRecurringInstances,
  applyRecurringTaskToSchedules,
  isDateInRecurrence
};