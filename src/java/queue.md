---
title: Queue Deque
---

:::danger
源代码基于JDK17
:::

## ArrayDeque
### 源码分析

```java
/**
 * 1.ArrayDeque 集合内部的主要结构是一个可循环数组，是一个固定大小的数组。
 * 2.head属性，用于标识下一次进行移除操作的数据对象索引位(队列头部的索引位）
 * 3.tail 的属性，主要用于标识下一次进行添加操作的数据对象索引位(队列 尾部的索引位)
 */
public class ArrayDeque<E> extends AbstractCollection<E>
        implements Deque<E>, Cloneable, Serializable {
    
    // 这个数组主要用于存储队列或双端队列中的数据对象
    transient Object[] elements;

    // 该变量指向数组所描述的队列头部(注意transient标识符)
    // 例如，可以通过该变量确定在remove()、pop()等方法中，从队列/双端队列中移除数据对象的索引位
    transient int head;

    // 该变量指向数组所描述的队列尾部的下一个索引位(注意transient标识符)
    // 例如，可以通过该变量确定在addLast(E)、add(E)、push(E)等方法中，
    // 在队列/双端队列中添加数据对象的索引位
    transient int tail;

    //集合的容量上限
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    private void grow(int needed) {
        // overflow-conscious code
        final int oldCapacity = elements.length;
        int newCapacity;
        // Double capacity if small; else grow by 50%
        // 注意:jump 变量的值是扩容增量值
        // 确定扩容策略，如果扩容前的容量值小于64(过小)，则扩容增量值为扩容前的容量值，
        // 否则扩容增量值为扩容前容量值的50%
        int jump = (oldCapacity < 64) ? (oldCapacity + 2) : (oldCapacity >> 1);
        // 注意:真正确认新容量的是"newCapacity = (oldCapacity + jump)" 这句代码
        // 如果条件成立，则说明新扩容的增量值不符合最小扩容增量值的要求，
        // 或者在扩容后，新的容量会大于MAX_ARRAY_SIZE常量的限制，
        // 这时需要使用newCapacity(int, int)方法进行临界值计算
        if (jump < needed
                || (newCapacity = (oldCapacity + jump)) - MAX_ARRAY_SIZE > 0)
            newCapacity = newCapacity(needed, jump);
        final Object[] es = elements = Arrays.copyOf(elements, newCapacity);
        // Exceptionally, here tail == head needs to be disambiguated
        // 这里需要考虑数组复制后的几种特殊情况
        // 例如，循环数组的tail属性和head属性所表示的有效数据范围刚好跨过0号索引位，
        // 或者tail索引位和head索引位交汇
        // 在这些情况下，需要重新修正扩容操作后新的循环数组中的数据对象存储状况
        if (tail < head || (tail == head && es[head] != null)) {
            // wrap around; slide first leg forward to end of array
            // 计算得到新容量值和旧容量值的差值
            int newSpace = newCapacity - oldCapacity;
            // 将当前head索引位之后的数据对象复制到从head + newSpace开始的索引位上
            System.arraycopy(es, head,
                    es, head + newSpace,
                    oldCapacity - head);
            // 从当前head索引位开始，向后一边清理错误位置上的数据对象，一边重新定位head索引位，直到正确为止
            for (int i = head, to = (head += newSpace); i < to; i++)
                es[i] = null;
        }
    }

    private int newCapacity(int needed, int jump) {
        final int oldCapacity = elements.length, minCapacity;
        if ((minCapacity = oldCapacity + needed) - MAX_ARRAY_SIZE > 0) {
            if (minCapacity < 0)
                throw new IllegalStateException("Sorry, deque too big");
            return Integer.MAX_VALUE;
        }
        if (needed > jump)
            return minCapacity;
        return (oldCapacity + jump - MAX_ARRAY_SIZE < 0)
                ? oldCapacity + jump
                : MAX_ARRAY_SIZE;
    }
    // 该构造方法是默认的构造方法，主要用于初始化一个长度为16 + 1的数组
    public ArrayDeque() {
        elements = new Object[16 + 1];
    }
    // 设置ArrayDeque集合的初始化容量，如果容量值小于1，则初始化一个容量值为1的数组
    public ArrayDeque(int numElements) {
        elements =
                new Object[(numElements < 1) ? 1 :
                        (numElements == Integer.MAX_VALUE) ? Integer.MAX_VALUE :
                                numElements + 1];
    }

    public ArrayDeque(Collection<? extends E> c) {
        this(c.size());
        copyElements(c);
    }

    static final int inc(int i, int modulus) {
        if (++i >= modulus) i = 0;
        return i;
    }

    static final int dec(int i, int modulus) {
        if (--i < 0) i = modulus - 1;
        return i;
    }

    public void addFirst(E e) {
        if (e == null)
            throw new NullPointerException();
        final Object[] es = elements;
        //获取上一个索引位置，并赋值
        es[head = dec(head, es.length)] = e;
        if (head == tail)
            grow(1);
    }

    public void addLast(E e) {
        if (e == null)
            throw new NullPointerException();
        final Object[] es = elements;
        es[tail] = e;
        if (head == (tail = inc(tail, es.length)))
            grow(1);
    }
}
```
### 版本差异
:::tip
#### jdk8
- 初始化默认的是一个16的数组
- 有参初始化最小为8,数组容量满足2的幂数
#### jdk8+(jdk17)
- 初始化默认的是一个17的数组
- 有参初始化如果小于1,初始化一个为1的数组,如果大于1,初始化一个numElements+1的数组
#### jdk8+总结
- +1的原因是:在循环数组中增加一个空置索引位，用于标识在完成数据对象添加操作 后是否需要进行扩容操作
- 对扩容过程也进行了调整，使数组的容量值不需要严格 满足 2 的幂数
:::
### 初始化以及扩容总结
:::warning
#### 扩容
- 如果扩容前数组大小小于64， 则按照扩容到原数组的2倍。如果扩容前数组大小大于64，则扩容到原数组的1.5倍。需要注意的是数组容量上限为Integer.MAX - 8。
#### 数据校正
- 执行扩容后，使用System.arraycopy基于head索引位进行数据校正。
- 计算扩容前后的数组长度差值，例如 扩容前为17 扩容后为34 差值为17。
- 复制当前的head的位置 例如当前head位置是2 复制后的数据目标位置为 2+17 = 19。
- 复制当前head 索引2 位置以及以后的数据到 索引10 位置以及以后。
- 旧索引位置复制到新索引位置成功后，清理掉原始错误索引位置上的数据对象为null等待垃圾回收，完成扩容。
:::
## PriorityQueue
### 源码分析
```java
public class PriorityQueue<E> extends AbstractQueue<E>
        implements java.io.Serializable {
    //该常量主要用于设置queue数组默认的容量
    private static final int DEFAULT_INITIAL_CAPACITY = 11;

    // 这个数组变量是一个完全二叉树的降维表达，其中的数据对象满足以下要求:  
    // the two children of queue[n] are queue[2*n+1] and queue[2*(n+1)]  
    transient Object[] queue; // non-private to simplify nested class access  

    int size;

    private final Comparator<? super E> comparator;
    // modCount变量表示当前PriorityQueqe队列从完成初始化到目前为止，其数据对象被修改的次数， 
    // 即进行数据写入操作的次数，这主要借鉴了CAS思想，即在非线程安全的场景中实现简单的数据安全判定  
    transient int modCount;     // non-private to simplify nested class access  

    public PriorityQueue() {
        this(DEFAULT_INITIAL_CAPACITY, null);
    }

    public PriorityQueue(int initialCapacity) {
        this(initialCapacity, null);
    }

    public PriorityQueue(Comparator<? super E> comparator) {
        this(DEFAULT_INITIAL_CAPACITY, comparator);
    }

    public PriorityQueue(int initialCapacity,
                         Comparator<? super E> comparator) {
        // Note: This restriction of at least one is not actually needed,  
        // but continues for 1.5 compatibility    if (initialCapacity < 1)  
        throw new IllegalArgumentException();
        this.queue = new Object[initialCapacity];
        this.comparator = comparator;
    }

    public PriorityQueue(Collection<? extends E> c) {
        if (c instanceof SortedSet<?>) {
            SortedSet<? extends E> ss = (SortedSet<? extends E>) c;
            this.comparator = (Comparator<? super E>) ss.comparator();
            initElementsFromCollection(ss);
        }
        else if (c instanceof PriorityQueue<?>) {
            PriorityQueue<? extends E> pq = (PriorityQueue<? extends E>) c;
            this.comparator = (Comparator<? super E>) pq.comparator();
            initFromPriorityQueue(pq);
        }
        else {
            this.comparator = null;
            initFromCollection(c);
        }
    }

    public PriorityQueue(PriorityQueue<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initFromPriorityQueue(c);
    }

    public PriorityQueue(SortedSet<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initElementsFromCollection(c);
    }

    private void grow(int minCapacity) {
        int oldCapacity = queue.length;
        // Double size if small; else grow by 50%  
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity < 64 ? oldCapacity + 2 : oldCapacity >> 1
                /* preferred growth */);
        queue = Arrays.copyOf(queue, newCapacity);
    }
}
```
### 初始化以及扩容总结
:::warning
- 默认构造器初始化为11，无参构造器不能小于1。
- 如果扩容前数组大小小于64 则按照扩容到原数组的2倍，如果扩容前数组大小大于64，则扩容到原数组的1.5倍。
- 默认为自然排序的小顶堆,通过指定一个逆序的Comparator，可以将其转换为大顶堆
:::