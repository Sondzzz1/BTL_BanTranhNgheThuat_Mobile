import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

interface StarRatingProps {
  rating: number; // 0-5
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showNumber?: boolean;
}

export default function StarRating({
  rating,
  size = 20,
  interactive = false,
  onRatingChange,
  showNumber = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const getStarIcon = (index: number) => {
    const diff = rating - index;
    if (diff >= 1) return '⭐'; // Full star
    if (diff >= 0.5) return '✨'; // Half star (approximation)
    return '☆'; // Empty star
  };

  const handleStarPress = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          interactive ? (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              activeOpacity={0.7}
            >
              <Text style={[styles.star, { fontSize: size }]}>
                {getStarIcon(star)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text key={star} style={[styles.star, { fontSize: size }]}>
              {getStarIcon(star)}
            </Text>
          )
        ))}
      </View>
      {showNumber && (
        <Text style={styles.ratingNumber}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
  },
});
