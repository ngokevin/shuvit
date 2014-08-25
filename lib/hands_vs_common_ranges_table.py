import json


def dump_hand_vs_common_ranges():
    f = open('files/hands_vs_common_ranges.csv', 'r')

    hand_to_equities = {}
    for i, row in enumerate(f.read().split('\n')):
        if i == 0 or not row:
            # Ignore header line.
            continue

        _, hand, _07, _11, _bway, _27, _20, _15, _36, _03, _05 = row.split(',')

        print 'Dumping hand: %s.' % hand
        hand_to_equities[hand] = {
            3: _03,
            5: _05,
            7: _07,
            11: _11,
            15: _15,
            20: _20,
            27: _27,
            36: _36
        }

    print 'Writing out.'
    output = open('output/hands_vs_common_ranges_table.json', 'w')
    output.write(json.dumps(hand_to_equities))


if __name__ == '__main__':
    dump_hand_vs_common_ranges()
