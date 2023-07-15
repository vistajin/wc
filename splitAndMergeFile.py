def split_file(input_file, chunk_size):
    with open(input_file, 'rb') as file:
        chunk_number = 0
        while True:
            chunk = file.read(chunk_size)
            if not chunk:
                break
            chunk_number += 1
            output_file = f'chunk_{chunk_number}.dat'  # 根据需求修改文件命名方式
            with open(output_file, 'wb') as output:
                output.write(chunk)


def merge_files(input_files, output_file):
    with open(output_file, 'wb') as output:
        for input_file in input_files:
            with open(input_file, 'rb') as input_chunk:
                output.write(input_chunk.read())


if __name__ == '__main__':
    split_file(r"C:\Users\Vista\Downloads\abc", 5024000)
    input_files = ['chunk_1.dat', 'chunk_2.dat', 'chunk_3.dat']
    # merge_files(input_files, "chr")
